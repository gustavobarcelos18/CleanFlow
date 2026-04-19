import {
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
} from '@whiskeysockets/baileys';
import { supabase } from '../lib/supabase';
import { SessionEncryptor } from '../lib/encryption';
import { logger } from '../index';

interface EncryptedSessionData {
  payload: string; 
  version: number;
}

export const getSupabaseAuthState = async (
  instanceId: string,
  masterKey: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  let stateMemory: { creds: any; keys: any } = {
    creds: initAuthCreds(),
    keys: {},
  };

  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('session_data')
    .eq('id', instanceId)
    .single();

  if (error && error.code !== 'PGRST116') { 
    logger.error({ instanceId, errMsg: error.message }, 'Error loading session data from Supabase');
    throw new Error('Failed to load session data cleanly');
  }

  if (data && data.session_data) {
    try {
      const dbData = data.session_data as EncryptedSessionData;
      if (dbData.payload) {
        const decryptedStr = SessionEncryptor.decrypt(dbData.payload, masterKey);
        const parsed = JSON.parse(decryptedStr, BufferJSON.reviver);
        stateMemory = parsed;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Decryption Error';
      logger.error({ instanceId, errMsg: msg }, 'Failed to decrypt or parse session data. Starting fresh.');
      stateMemory = { creds: initAuthCreds(), keys: {} };
      
      // Explicitly mark as disconnected but DO NOT nullify session_data to avoid infinite QR loop in case of bad decryption env key
      await supabase.from('whatsapp_instances').update({ status: 'DISCONNECTED' }).eq('id', instanceId);
    }
  }

  const state: AuthenticationState = {
    creds: stateMemory.creds,
    keys: {
      get: <T extends keyof import('@whiskeysockets/baileys').SignalDataTypeMap>(type: T, ids: string[]) => {
        const data: { [id: string]: import('@whiskeysockets/baileys').SignalDataTypeMap[T] } = {};
        for (const id of ids) {
          const value = stateMemory.keys[`${String(type)}-${id}`];
          if (type === 'app-state-sync-key' && value) {
            data[id] = proto.Message.AppStateSyncKeyData.fromObject(value) as unknown as import('@whiskeysockets/baileys').SignalDataTypeMap[T];
          } else {
            data[id] = value as unknown as import('@whiskeysockets/baileys').SignalDataTypeMap[T];
          }
        }
        return data;
      },
      set: (data: Record<string, Record<string, unknown>>) => {
        let hasChanges = false;
        for (const category in data) {
          for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            if (value) {
              stateMemory.keys[key] = value;
              hasChanges = true;
            } else {
              delete stateMemory.keys[key];
              hasChanges = true;
            }
          }
        }
        if (hasChanges) {
          saveCreds(); 
        }
      },
    },
  };

  let isSaving = false;
  let hasPendingSave = false;
  
  const performSave = async () => {
    isSaving = true;
    try {
      const jsonStr = JSON.stringify(stateMemory, BufferJSON.replacer);
      const encryptedStr = SessionEncryptor.encrypt(jsonStr, masterKey);
      
      const payload: EncryptedSessionData = {
        payload: encryptedStr,
        version: 1,
      };

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ session_data: payload, updated_at: new Date().toISOString() })
        .eq('id', instanceId);

      if (updateError) {
        logger.error({ instanceId, errMsg: updateError.message }, 'Failed to save session data to Supabase');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown Encryption Error';
      logger.error({ instanceId, errMsg }, 'Error encrypting and saving session');
    } finally {
      isSaving = false;
      if (hasPendingSave) {
        hasPendingSave = false;
        performSave();
      }
    }
  };

  const saveCreds = async () => {
    if (isSaving) {
      hasPendingSave = true;
      return;
    }
    await performSave();
  };

  return { state, saveCreds };
};

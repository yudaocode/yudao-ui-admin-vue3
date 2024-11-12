import { ConversationModelType } from '@/views/chat/types/types'
import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Define your database schema
interface MyDB extends DBSchema {
  Conversations: {
    key: string
    value: ConversationModelType
  }
}

let dbPromise: Promise<IDBPDatabase<MyDB>>

export const initDB = () => {
  if (!dbPromise) {
    try {
      dbPromise = openDB<MyDB>('yudao-im-indexeddb', 1, {
        upgrade(db) {
          db.createObjectStore('Conversations', { keyPath: 'conversationNo' })
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
  return dbPromise
}

export const addConversation = async (conversation: ConversationModelType) => {

  try {
    const db = await initDB()
    await db.put('Conversations', conversation)
  } catch (error) {
    console.error(conversation)
    console.error(error)
  }

}

export const getConversation = async (conversationNo: string) => {

  try {
    const db = await initDB()
    return await db.get('Conversations', conversationNo)
  } catch (error) {
    console.error(error)
  }

}

export const deleteConversation = async (conversationNo: string) => {

  try {
    const db = await initDB()
    await db.delete('Conversations', conversationNo)
  } catch (error) {
    console.error(error)
  }

}

export const getAllConversations = async () => {

  try {
    const db = await initDB()
    return await db.getAll('Conversations')
  } catch (error) {
    console.log(error)
  }

}

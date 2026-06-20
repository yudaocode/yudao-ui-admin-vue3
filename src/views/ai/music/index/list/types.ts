import type { InjectionKey, Ref } from 'vue'

export interface MusicSong {
  id?: number
  title?: string
  singer?: string
  imageUrl?: string
  audioUrl?: string
  desc?: string
  date?: string
  lyric?: string
}

export const currentSongKey: InjectionKey<Ref<MusicSong>> = Symbol('currentSong')

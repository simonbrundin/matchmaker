export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export interface PlayerNameFields {
  first_name: string
  last_name?: string | null
}

export function playerFullName(player: PlayerNameFields): string {
  if (!player.first_name) return ''
  if (!player.last_name) return player.first_name
  return `${player.first_name} ${player.last_name}`
}

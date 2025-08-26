export type Lang = 'en' | 'es';

interface Dictionary {
  [key: string]: { [key: string]: string };
}

/**
 * A simple dictionary of English and Spanish strings. Extend this
 * dictionary as new UI strings are introduced. Keys are lower case
 * English identifiers; values are translated strings.
 */
export const dictionary: Dictionary = {
  en: {
    play: 'Play',
    startGame: 'Start Game',
    nextBattle: 'Next Battle',
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    specialAttack: 'Sp. Atk',
    specialDefense: 'Sp. Def',
    speed: 'Speed',
    level: 'Level',
    experience: 'XP',
    coins: 'Coins',
    upgrades: 'Upgrades',
    team: 'Team',
    battleLog: 'Battle Log',
    mute: 'Mute',
    unmute: 'Unmute',
    reset: 'Reset Progress',
    language: 'Language'
    ,
    'choose your starter': 'Choose your starter'
  },
  es: {
    play: 'Jugar',
    startGame: 'Comenzar',
    nextBattle: 'Siguiente batalla',
    hp: 'PS',
    attack: 'Ataque',
    defense: 'Defensa',
    specialAttack: 'Atq. Esp.',
    specialDefense: 'Def. Esp.',
    speed: 'Velocidad',
    level: 'Nivel',
    experience: 'XP',
    coins: 'Monedas',
    upgrades: 'Mejoras',
    team: 'Equipo',
    battleLog: 'Registro',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    reset: 'Reiniciar',
    language: 'Idioma'
    ,
    'choose your starter': 'Elige tu inicial'
  }
};
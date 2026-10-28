/** Shared client-side password rule for signup and password resets. */
export const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{12,128}$/

export const STRONG_PASSWORD_HINT = '12 caractères minimum, avec une minuscule, une majuscule, un chiffre et un symbole, sans espace.'

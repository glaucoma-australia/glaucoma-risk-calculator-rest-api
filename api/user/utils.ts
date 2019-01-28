import { freemem } from 'os';

import * as argon2 from 'argon2';

export const argon2_options: argon2.Options & {raw?: false} = Object.freeze({
    timeCost: 4, memoryCost: Math.max(Math.trunc(freemem() / 2000000), 64),
    parallelism: 2, type: argon2.argon2d, raw: false as false
});

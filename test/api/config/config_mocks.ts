import * as faker from 'faker';
import { Config } from '../../../api/config/models';


export const config_mocks: {successes: Config[], failures: Array<{}>} = {
    failures: [
        {}, { client_id: 0, tenant_id: '' }, { client_id: '', tenant_id: '' }
    ],
    successes: Array(10)
        .fill(void 0)
        .map(() => {
            const config = new Config();

            config.client_id = Math.random().toString(15);
            config.tenant_id = Math.random().toString(15);

            return config;
        })
};

if (require.main === module) {
    /* tslint:disable:no-console */
    console.info(config_mocks);
}

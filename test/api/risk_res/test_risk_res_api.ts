import { IModelRoute } from 'nodejs-utils';
import { strapFramework } from 'restify-orm-framework';
import { Collection, Connection } from 'waterline';
import { Server } from 'restify';
import { Response } from 'supertest';
import { all_models_and_routes_as_mr, c, IObjectCtor, strapFrameworkKwargs } from '../../../main';
import { create_and_auth_users, tearDownConnections } from '../../shared_tests';
import { RiskResTestSDK } from './risk_res_test_sdk';
import { user_mocks } from '../user/user_mocks';
import { IAuthSdk } from '../auth/auth_test_sdk.d';
import { AuthTestSDK } from '../auth/auth_test_sdk';
import { IUserBase } from '../../../api/user/models.d';
import { risk_res_mocks } from './risk_res_mocks';
import { IRiskRes } from '../../../api/risk_res/models.d';

declare const Object: IObjectCtor;

const models_and_routes: IModelRoute = {
    user: all_models_and_routes_as_mr['user'],
    auth: all_models_and_routes_as_mr['auth'],
    risk_res: all_models_and_routes_as_mr['risk_res']
};

process.env['NO_SAMPLE_DATA'] = 'true';
const user_mocks_subset: IUserBase[] = user_mocks.successes.slice(60, 70);

describe('RiskRes::routes', () => {
    let sdk: RiskResTestSDK;
    let auth_sdk: IAuthSdk;
    let app: Server;

    before('tearDownConnections', done => tearDownConnections(c.connections, done));

    before('strapFramework', done => strapFramework(Object.assign({}, strapFrameworkKwargs, {
        models_and_routes,
        createSampleData: false,
        skip_start_app: true,
        skip_redis: false,
        app_name: 'test-risk-res-api',
        callback: (err, _app, _connections: Connection[], _collections: Collection[]) => {
            if (err != null) return done(err);
            c.connections = _connections;
            c.collections = _collections;
            app = _app;
            sdk = new RiskResTestSDK(app);
            auth_sdk = new AuthTestSDK(app);
            return done();
        }
    })));

    before('Create & auth users', done => create_and_auth_users(user_mocks_subset, auth_sdk, done));

    // Deregister database adapter connections
    after('unregister all users', done => auth_sdk.unregister_all(user_mocks_subset, done));
    after('tearDownConnections', done => tearDownConnections(c.connections, done));

    describe('/api/risk_res', () => {
        afterEach('deleteRiskRes', done =>
            sdk.destroy(user_mocks_subset[0].access_token, risk_res_mocks.successes[0], done));

        it('POST should create RiskRes', done =>
            sdk.create(user_mocks_subset[0].access_token, risk_res_mocks.successes[0], done)
        );
    });

    describe('/api/risk_res/:createdAt', () => {
        before('createRiskRes', done =>
            sdk.create(user_mocks_subset[0].access_token, risk_res_mocks.successes[1],
                (e, r: Response) => {
                    if (e == null && r != null) risk_res_mocks.successes[1] = r.body as any;
                    return done();
                }));
        after('deleteRiskRes', done =>
            sdk.destroy(user_mocks_subset[0].access_token, risk_res_mocks.successes[1], done));

        it('GET should retrieve RiskRes', done =>
            sdk.get(user_mocks_subset[0].access_token, risk_res_mocks.successes[1] as IRiskRes, done)
        );

        it('DELETE should destroy RiskRes', done =>
            sdk.destroy(user_mocks_subset[0].access_token, risk_res_mocks.successes[1], done)
        );
    });
});

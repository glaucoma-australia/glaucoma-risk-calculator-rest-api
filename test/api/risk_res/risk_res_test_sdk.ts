import supertest, { Response } from 'supertest';
import * as chai from 'chai';
import { expect } from 'chai';

import { getError, sanitiseSchema, supertestGetError } from '@offscale/nodejs-utils';

import { User } from '../../../api/user/models';
import { RiskRes } from '../../../api/risk_res/models';
import * as risk_res_route from '../../../api/risk_res/route';
import * as risk_res_routes from '../../../api/risk_res/routes';

const chaiJsonSchema = require('chai-json-schema');

/* tslint:disable:no-var-requires */
const user_schema = sanitiseSchema(require('./../user/schema.json'), User._omit);
const risk_res_schema = require('./schema.json');

chai.use(chaiJsonSchema);

export class RiskResTestSDK {
    constructor(public app) {
    }

    public create(access_token: string, risk_res: RiskRes): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (access_token == null) return reject(new TypeError('`access_token` argument to `create` must be defined'));
            else if (risk_res == null) return reject(new TypeError('`risk_res` argument to `create` must be defined'));

            expect(risk_res_routes.create).to.be.an.instanceOf(Function);
            supertest(this.app)
                .post('/api/risk_res')
                .set('Connection', 'keep-alive')
                .set('X-Access-Token', access_token)
                .send(risk_res)
                .expect('Content-Type', /json/)
                .end((err, res: Response) => {
                    if (err != null) return reject(supertestGetError(err, res));
                    else if (res.error) return reject(getError(res.error));

                    try {
                        expect(res.status).to.be.equal(201);
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.be.jsonSchema(risk_res_schema);
                    } catch (e) {
                        return reject(e as Chai.AssertionError);
                    }
                    return resolve(res);
                });
        });
    }

    public get(access_token: string, risk_res: RiskRes): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (access_token == null) return reject(new TypeError('`access_token` argument to `getAll` must be defined'));
            else if (risk_res == null) return reject(new TypeError('`risk_res` argument to `getAll` must be defined'));
            /*else if (isNaN(risk_res.createdAt as any))
             return callback(new TypeError(`\`risk_res.createdAt\` must not be NaN in \`getAll\` ${risk_res.createdAt}`));*/

            expect(risk_res_route.read).to.be.an.instanceOf(Function);
            supertest(this.app)
                .get(`/api/risk_res/${risk_res.id}`)
                .set('Connection', 'keep-alive')
                .set('X-Access-Token', access_token)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res: Response) => {
                    if (err != null) return reject(supertestGetError(err, res));
                    else if (res.error) return reject(getError(res.error));
                    try {
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.be.jsonSchema(risk_res_schema);
                    } catch (e) {
                        return reject(e as Chai.AssertionError);
                    }
                    return resolve(res);
                });
        });
    }

    public getAll(access_token: string): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (access_token == null) return reject(new TypeError('`access_token` argument to `getAll` must be defined'));
            /*else if (isNaN(risk_res.createdAt as any))
             return callback(new TypeError(`\`risk_res.createdAt\` must not be NaN in \`getAll\` ${risk_res.createdAt}`));*/

            expect(risk_res_routes.getAll).to.be.an.instanceOf(Function);
            supertest(this.app)
                .get('/api/risk_res')
                .set('Connection', 'keep-alive')
                .set('X-Access-Token', access_token)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res: Response) => {
                    if (err != null) return reject(supertestGetError(err, res));
                    else if (res.error) return reject(getError(res.error));
                    try {
                        expect(res.body).to.be.an('object');
                        expect(res.body).to.have.property('risk_res');
                        expect(res.body.risk_res).to.be.an.instanceOf(Array);
                        res.body.risk_res.forEach(risk_res => expect(risk_res).to.be.jsonSchema(risk_res_schema));
                    } catch (e) {
                        return reject(e as Chai.AssertionError);
                    }
                    return resolve(res);
                });
        });
    }

    public destroy(access_token: string, risk_res: RiskRes): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (access_token == null)
                return reject(new TypeError('`access_token` argument to `destroy` must be defined'));
            else if (risk_res == null)
                return reject(new TypeError('`risk_res` argument to `destroy` must be defined'));

            expect(risk_res_route.read).to.be.an.instanceOf(Function);
            supertest(this.app)
                .del(`/api/risk_res/${risk_res.createdAt}`)
                .set('Connection', 'keep-alive')
                .set('X-Access-Token', access_token)
                .end((err, res: Response) => {
                    if (err != null) return reject(supertestGetError(err, res));
                    else if (res.error) return reject(getError(res.error));
                    try {
                        expect(res.status).to.be.equal(204);
                    } catch (e) {
                        return reject(e as Chai.AssertionError);
                    }
                    return resolve(res);
                });
        });
    }
}

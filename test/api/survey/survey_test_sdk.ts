import * as supertest from 'supertest';
import { Response } from 'supertest';
import * as chai from 'chai';
import { expect } from 'chai';
import { getError, sanitiseSchema, supertestGetError } from '@offscale/nodejs-utils';
import { User } from '../../../api/user/models';
import { IncomingMessageError, TCallback } from '@offscale/nodejs-utils/interfaces';
import { Survey } from '../../../api/survey/models';

const chaiJsonSchema = require('chai-json-schema');

/* tslint:disable:no-var-requires */
const user_schema = sanitiseSchema(require('./../user/schema.json'), User._omit);
const survey_schema = require('./schema.json');

chai.use(chaiJsonSchema);

export class SurveyTestSDK {
    constructor(public app) {
    }

    public create(access_token: string, survey: Survey,
                  callback: TCallback<Error | IncomingMessageError, Response>) {
        if (access_token == null) return callback(new TypeError('`access_token` argument to `create` must be defined'));
        else if (survey == null) return callback(new TypeError('`survey` argument to `create` must be defined'));

        supertest(this.app)
            .post('/api/survey')
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .send(survey)
            .expect('Content-Type', /json/)
            .end((err, res: Response) => {
                if (err != null) throw supertestGetError(err, res);
                else if (res.error) return callback(getError(res.error));

                try {
                    expect(res.status).to.be.equal(201);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.be.jsonSchema(survey_schema);
                } catch (e) {
                    err = e as Chai.AssertionError;
                } finally {
                    callback(err, res);
                }
            });
    }

    public get(access_token: string, survey: Survey, callback: TCallback<Error | IncomingMessageError, Response>) {
        if (access_token == null) return callback(new TypeError('`access_token` argument to `getAll` must be defined'));
        else if (survey == null) return callback(new TypeError('`survey` argument to `getAll` must be defined'));
        /*else if (isNaN(survey.createdAt as any))
         return callback(new TypeError(`\`survey.createdAt\` must not be NaN in \`getAll\` ${survey.createdAt}`));*/

        supertest(this.app)
            .get(`/api/survey/${survey.id}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res: Response) => {
                if (err != null) throw supertestGetError(err, res);
                else if (res.error) return callback(getError(res.error));
                try {
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.be.jsonSchema(survey_schema);
                } catch (e) {
                    err = e as Chai.AssertionError;
                } finally {
                    callback(err, res);
                }
            });
    }

    public getAll(access_token: string, callback: TCallback<Error | IncomingMessageError, Response>) {
        if (access_token == null) return callback(new TypeError('`access_token` argument to `getAll` must be defined'));
        /*else if (isNaN(survey.createdAt as any))
         return callback(new TypeError(`\`survey.createdAt\` must not be NaN in \`getAll\` ${survey.createdAt}`));*/

        supertest(this.app)
            .get('/api/survey')
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res: Response) => {
                if (err != null) throw supertestGetError(err, res);
                else if (res.error) return callback(getError(res.error));
                try {
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.property('survey');
                    expect(res.body.survey).to.be.an.instanceOf(Array);
                    res.body.survey.forEach(survey => expect(survey).to.be.jsonSchema(survey_schema));
                } catch (e) {
                    err = e as Chai.AssertionError;
                } finally {
                    callback(err, res);
                }
            });
    }

    public destroy(access_token: string, survey: Survey,
                   callback: TCallback<Error | IncomingMessageError, Response>) {
        if (access_token == null)
            return callback(new TypeError('`access_token` argument to `destroy` must be defined'));
        else if (survey == null)
            return callback(new TypeError('`survey` argument to `destroy` must be defined'));

        supertest(this.app)
            .del(`/api/survey/${survey.createdAt}`)
            .set('Connection', 'keep-alive')
            .set('X-Access-Token', access_token)
            .end((err, res: Response) => {
                if (err != null) throw supertestGetError(err, res);
                else if (res.error) return callback(res.error);
                try {
                    expect(res.status).to.be.equal(204);
                } catch (e) {
                    err = e as Chai.AssertionError;
                } finally {
                    callback(err, res);
                }
            });
    }
}

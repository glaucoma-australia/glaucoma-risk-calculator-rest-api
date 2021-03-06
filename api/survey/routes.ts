import * as restify from 'restify';
import { JsonSchema } from 'tv4';

import { fmtError, NotFoundError } from '@offscale/custom-restify-errors';
import { has_body, mk_valid_body_mw_ignore } from '@offscale/restify-validators';
import { IOrmReq } from '@offscale/orm-mw/interfaces';

import { has_auth } from '../auth/middleware';
import { Survey } from './models';
import { emptyTypeOrmResponse } from '../../utils';
import { InsertResult } from 'typeorm';

/* tslint:disable:no-var-requires */
const survey_schema: JsonSchema = require('./../../test/api/survey/schema');

export const create = (app: restify.Server, namespace: string = ''): void => {
    app.post(namespace, has_body, mk_valid_body_mw_ignore(survey_schema, ['createdAt', 'id']),
        (request: restify.Request, res: restify.Response, next: restify.Next) => {
            const req = request as unknown as IOrmReq & restify.Request;
            const Survey_r = req.getOrm().typeorm!.connection.getRepository(Survey);

            const survey = new Survey();
            Object.keys(req.body).forEach(k => survey[k] = req.body[k]);

            Survey_r
                .insert(survey)
                .then((insert_result: InsertResult) => {
                    if (insert_result == null || emptyTypeOrmResponse(insert_result))
                        return next(new NotFoundError('Survey'));
                    res.json(201, Object.assign(req.body, insert_result.generatedMaps[0]));
                    return next();
                })
                .catch(error => next(fmtError(error)));
        }
    );
};

export const getAll = (app: restify.Server, namespace: string = ''): void => {
    app.get(namespace, has_auth('admin'),
        (request: restify.Request, res: restify.Response, next: restify.Next) => {
            const req = request as unknown as IOrmReq & restify.Request;
            const Survey_r = req.getOrm().typeorm!.connection.getRepository(Survey);

            Survey_r
                .find()
                .then((survey: Survey[]) => {
                    if (survey == null || !survey.length) return next(new NotFoundError('Survey'));
                    res.json({ survey });
                    return next();
                })
                .catch(error => next(fmtError(error)));
        }
    );
};

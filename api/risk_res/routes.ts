import * as restify from 'restify';
import { Query, WLError } from 'waterline';
import { fmtError, NotFoundError } from 'custom-restify-errors';
import { has_body, mk_valid_body_mw_ignore } from 'restify-validators';
import { JsonSchema } from 'tv4';
import { IOrmReq } from 'orm-mw';

import { has_auth } from '../auth/middleware';
import { IRiskRes } from './models.d';

/* tslint:disable:no-var-requires */
const risk_res_schema: JsonSchema = require('./../../test/api/risk_res/schema');

export const create = (app: restify.Server, namespace: string = ''): void => {
    app.post(namespace, has_body, mk_valid_body_mw_ignore(risk_res_schema, ['createdAt', 'id']),
        (req: restify.Request & IOrmReq, res: restify.Response, next: restify.Next) => {
            const RiskRes: Query = req.getOrm().waterline.collections['risk_res_tbl'];

            RiskRes.create(req.body).exec((error: WLError | Error, risk_res: IRiskRes) => {
                if (error != null) return next(fmtError(error));
                else if (risk_res == null) return next(new NotFoundError('RiskRes'));
                res.json(201, risk_res);
                return next();
            });
        }
    );
};

export const getAll = (app: restify.Server, namespace: string = ''): void => {
    app.get(namespace, has_auth('admin'),
        (req: restify.Request & IOrmReq, res: restify.Response, next: restify.Next) => {
            const RiskRes: Query = req.getOrm().waterline.collections['risk_res_tbl'];

            RiskRes.find().exec((error: WLError | Error, risk_res: IRiskRes[]) => {
                if (error != null) return next(fmtError(error));
                else if (risk_res == null || !risk_res.length) return next(new NotFoundError('RiskRes'));
                res.json({ risk_res });
                return next();
            });
        }
    );
};

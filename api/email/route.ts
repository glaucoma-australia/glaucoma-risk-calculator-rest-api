import * as async from 'async';
import { waterfall } from 'async';
import * as restify from 'restify';
import { IOrmReq } from 'orm-mw';
import { fmtError } from 'custom-restify-errors';
import { Query } from 'waterline';
import * as querystring from 'querystring';
import { has_body, mk_valid_body_mw } from 'restify-validators';

import { httpRequest } from '../../test/SampleData';
import { has_auth } from '../auth/middleware';
import { getConfig, upsertConfig } from '../config/sdk';
import { readManyTemplates } from '../template/sdk';
import { IRiskRes } from '../risk_res/models.d';
import { IConfig } from '../config/models.d';
import { IMail, ITokenResponse } from './ms_graph_api.d';
import { MSGraphAPI } from './ms_graph_api';

const tokenOutputSchema = {
    type: 'object',
    properties: {
        token_type: {
            type: 'string'
        },
        scope: {
            type: 'string'
        },
        expires_in: {
            type: 'number'
        },
        access_token: {
            type: 'string'
        },
        refresh_token: {
            type: 'string'
        }
    },
    required: [
        'token_type', 'scope', 'expires_in', 'access_token', 'refresh_token'
    ]
};

const tokenInputSchema = {
    type: 'object',
    properties: {
        client_id: {
            type: 'string'
        },
        client_secret: {
            type: 'string'
        },
        grant_type: {
            type: 'string'
        },
        scope: {
            type: 'string'
        },
        code: {
            type: 'string'
        },
        redirect_uri: {
            type: 'string'
        }
    },
    required: [
        'client_id', 'grant_type', 'scope', 'code'
    ]
};

export const msAuth = (app: restify.Server, namespace: string = ''): void => {
    app.post(`${namespace}/ms-auth`, has_auth(), has_body, mk_valid_body_mw(tokenInputSchema),
        (req: restify.Request & IOrmReq, res: restify.Response, next: restify.Next) => {
            const qs = querystring.stringify(req.body);

            httpRequest<ITokenResponse>({
                    method: 'POST',
                    host: 'https://login.microsoftonline.com',
                    path: '/common/oauth2/v2.0/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(qs)
                    }
                }, qs
            )
                .then(token_response => {
                    console.info('msAuth::token_response:', token_response, ';');
                    req.body = token_response;

                    upsertConfig(req, (err, config) => {
                        if (err != null) return next(fmtError(err));
                        res.json(201, config);
                        return next();
                    });
                })
                .catch(err => {
                    console.error('msAuth::err:', err, ';');
                    return next(fmtError(err));
                });
        }
    );
};

export const sendEmail = (app: restify.Server, namespace: string = ''): void => {
    app.post(`${namespace}/:recipient/:risk_id`,
        (req: restify.Request & IOrmReq, res: restify.Response, next: restify.Next) => {
            waterfall([
                cb => getConfig(req, cb),
                (config, cb) => readManyTemplates(req, (err, templates) =>
                    cb(err, config, templates)
                ),
                (config, templates, cb) => {
                    const RiskRes: Query = req.getOrm().waterline.collections['risk_res_tbl'];
                    RiskRes
                        .findOne({ id: req.params.risk_id })
                        .exec((err, risk_res) => cb(err, risk_res, config, templates));
                },
                (risk_res: IRiskRes, config: IConfig, templates, cb) => {
                    const templatesMap = new Map<string, string>();
                    templates.templates
                        .forEach(template =>
                            templatesMap.set(template.kind, template.contents)
                        );

                    const safeGet = (map: Map<any, any>, key: any) =>
                        map.has(key) ? map.get(key) : void 0;

                    const share_url = `https://calculator.glaucoma.org.au/${risk_res.id}`;

                    return cb(void 0, config, {
                        recipient: req.params.recipient,
                        subject: safeGet(templatesMap, 'email_subject'),
                        content: `${safeGet(templatesMap, 'email_contents')} ${share_url}`
                    });
                },
                (config: IConfig, mail: IMail, cb) =>
                    console.info('sendEmail::config:', config, ';'
                    ) || (async as any as {tryEach: typeof async['each']}).tryEach([
                        c_b => console.info('sendEmail::sendEmail') || MSGraphAPI
                            .instance(config)
                            .sendEmail(mail, c_b),
                        c_b => console.info('sendEmail::getNewAccessToken') || MSGraphAPI
                            .instance(config)
                            .getNewAccessToken((e, tokens) => {
                                if (e != null) return c_b(e);
                                req.body = tokens;
                                console.info('sendEmail::getNewAccessToken::tokens:', tokens, ';');
                                upsertConfig(req, (er, re) => {
                                    if (er != null) return c_b(er);
                                    config = re;
                                    return c_b(void 0, re);
                                });
                            }),
                        c_b => console.info('sendEmail::sendEmail') || MSGraphAPI
                            .instance(config)
                            .sendEmail(mail, c_b),
                    ], cb)
            ], (errors, mail: IMail) => {
                if (errors != null) return next(fmtError(errors));
                res.json(mail);
                return next();
            });
        }
    );
};

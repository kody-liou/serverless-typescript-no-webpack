// # sourceMappingURL=auth.js.map
require('dotenv').config();

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import type { APIGatewayEvent } from 'aws-lambda';
import { firebaseAdmin } from '../helpers/gcp';

const generatePolicy = (principalId: string, methodArn: string) => {
  const apiGatewayWildcard = `${methodArn.split('/', 2).join('/')}/*`;
  const authResponse = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: apiGatewayWildcard,
        },
      ],
    },
  };
  return authResponse;
};

export const auth = middy(
  async (
    event: APIGatewayEvent & {
      authorizationToken?: string;
      methodArn: string;
    },
  ) => {
    if (!event.authorizationToken) {
      throw new Error('Unauthorized');
    }
    const tokenParts = event.authorizationToken.split(' ');
    const tokenValue = tokenParts[1];
    if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
      throw new Error('Unauthorized');
    }
    try {
      const decodedToken = await firebaseAdmin()
        .auth()
        .verifyIdToken(tokenValue);
      const { sub, email, email_verified: emailVerified } = decodedToken;
      if (!sub || !email || !emailVerified) {
        throw new Error('Unauthorized');
      }
      const policy = generatePolicy(sub, event.methodArn);
      return {
        ...policy,
        context: {
          sub,
        },
      };
    } catch (error) {
      throw new Error(`Unauthorized: ${error}`);
    }
  },
)
  .use(httpErrorHandler())
  .use(httpEventNormalizer());

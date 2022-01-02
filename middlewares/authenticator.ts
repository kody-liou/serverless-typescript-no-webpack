import jwtDecode from 'jwt-decode';
import type middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export type Event = {
  authedUserId: string;
} & APIGatewayProxyEvent;

export default (): middy.MiddlewareObj<Event, APIGatewayProxyResult> => {
  const before: middy.MiddlewareFn<Event, APIGatewayProxyResult> = async (
    request,
  ): Promise<APIGatewayProxyResult | void> => {
    try {
      const { event } = request;
      let sub: string;
      const authText =
        event.headers.Authorization || event.headers.authorization;
      if (process.env.SKIP_AUTH && authText) {
        const decodedToken = jwtDecode<{ sub: string }>(authText);
        sub = decodedToken.sub;
      } else {
        sub = event.requestContext.authorizer?.sub;
      }
      const userId = event.pathParameters?.userId || sub;
      if (!userId) return { statusCode: 403, body: 'No userId' };
      if (userId !== sub) {
        return { statusCode: 403, body: 'userId no equal to sub' };
      }
      event.authedUserId = userId;
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        body: error,
      };
    }
  };
  return {
    before,
  };
};

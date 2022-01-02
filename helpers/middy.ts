import httpResponseSerializer from '@middy/http-response-serializer';

export const responseSerializer = httpResponseSerializer({
  serializers: [
    {
      regex: /^application\/json$/,
      serializer: ({ body }) => JSON.stringify(body),
    },
    {
      regex: /^text\/plain$/,
      serializer: ({ body }) => body,
    },
  ],
  default: 'application/json',
});

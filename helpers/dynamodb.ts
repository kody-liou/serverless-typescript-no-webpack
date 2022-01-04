import { nanoid } from 'nanoid';
import microtime from 'microtime';
import {
  DynamoDB,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';

const docClient = new DynamoDB({ region: process.env.REGION! });

const queryByGS1PK = async (GS1PK: string, userId?: string) => {
  const params: QueryCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    IndexName: 'GS1PK-index',
    KeyConditionExpression: 'GS1PK = :gs1pk',
    ExpressionAttributeValues: {
      ':gs1pk': { S: GS1PK },
    },
    ScanIndexForward: false,
  };
  if (userId) {
    params.FilterExpression = 'PK = :pk';
    params.ExpressionAttributeValues = {
      ...params.ExpressionAttributeValues,
      ':pk': { S: `user#${userId}` },
    };
  }
  const command = new QueryCommand(params);
  return docClient.send(command);
};

const queryByGS2PK = async (GS2PK: string, userId?: string) => {
  const params: QueryCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    IndexName: 'GS2PK-index',
    KeyConditionExpression: 'GS2PK = :gs2pk',
    ExpressionAttributeValues: {
      ':gs2pk': { S: GS2PK },
    },
    ScanIndexForward: false,
  };
  if (userId) {
    params.FilterExpression = 'PK = :pk';
    params.ExpressionAttributeValues = {
      ...params.ExpressionAttributeValues,
      ':pk': { S: `user#${userId}` },
    };
  }
  const command = new QueryCommand(params);
  return docClient.send(command);
};

export const getByGS1PK = async (GS1PK: string, userId?: string) => {
  const data = await queryByGS1PK(GS1PK, userId);
  if (!data.Items) return null;
  return data.Items.length > 0 ? data.Items[data.Items.length - 1] : null;
};

export const getByGS2PK = async (GS2PK: string, userId?: string) => {
  const data = await queryByGS2PK(GS2PK, userId);
  if (!data.Items) return null;
  return data.Items.length > 0 ? data.Items[data.Items.length - 1] : null;
};

export const indexByGS2PK = async (
  GS2PK: string,
  userId?: string,
): Promise<{ [key: string]: AttributeValue }[] | null> => {
  const data = await queryByGS2PK(GS2PK, userId);
  return data.Items || null;
};

export enum DBResourceType {
  report = 'report',
  image = 'image',
  blood = 'blood',
  appointment = 'appointment',
  visit = 'visit',
  weight = 'weight',
  file = 'file',
}

export const indexByType = async (
  userId: string,
  type: DBResourceType,
): Promise<{ [key: string]: AttributeValue }[] | null> => {
  const params: QueryCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    KeyConditionExpression: 'PK = :userId and begins_with(SK, :type)',
    ExpressionAttributeValues: {
      ':userId': { S: `user#${userId}` },
      ':type': { S: type },
    },
    ScanIndexForward: false,
  };
  const data = await docClient.send(new QueryCommand(params));
  return data.Items || null;
};

export const getByTypeAndTypeId = async (
  type: DBResourceType,
  typeId: string,
  userId?: string,
): Promise<QueryCommandInput | null> =>
  getByGS1PK(`${type}#${typeId}`, userId) as Promise<QueryCommandInput | null>;

export const deleteByTypeAndTypeId = async (
  userId: string | null,
  type: DBResourceType,
  typeId: string,
) => {
  const item = await getByTypeAndTypeId(userId, type, typeId);
  if (!item) {
    return null;
  }
  const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    Key: {
      PK: item.PK,
      SK: item.SK,
    },
    ConditionExpression: 'GS1PK = :gs1pk',
    ExpressionAttributeValues: {
      ':gs1pk': item.GS1PK,
    },
  };
  await docClient.delete(params).promise();
  return item;
};

export type Overrides = {
  id?: string;
  ts?: number;
};

// 每筆資料基本都會有的資料
export type DBCommon = {
  PK: string;
  SK: string;
  GS1PK: string;
  GS2PK: string;
  GS3PK: string;
  ts: string;
};

type CreateOrUpdateItemArg = {
  userId: string;
  type: DBResourceType;
  GS1PK?: string | null;
  GS2PK?: string | null;
  GS3PK?: string | null;
  data: any;
  attrOverrides?: Overrides;
};

export type CreateOrUpdateReturn<T> = {
  existing: boolean;
  newObj: T;
};
/**
 * @param GS1PK `${type}#${typeId}`
 * @param GS2PK `visit#${visitId}#${type}`
 * @param attrOverrides If attrOverrides.id is specified, we first check if this should be an update operation. Else, create new item
 * @param data 裡面假如有 null 就會把資料移除
 */
export const createOrUpdateItem = async ({
  userId,
  type,
  GS1PK,
  GS2PK,
  GS3PK,
  data,
  attrOverrides,
}: CreateOrUpdateItemArg): Promise<CreateOrUpdateReturn<T>> => {
  const idOverride = attrOverrides?.id;
  const tsOverride = attrOverrides?.ts;
  let newObj: AWS.DynamoDB.DocumentClient.AttributeMap = {};
  if (idOverride) {
    const existingItem = await getByTypeAndTypeId(null, type, idOverride);
    if (existingItem) {
      const existingUserId = existingItem.PK.split('#')[1];
      // Existing record found but user id mismatch.
      // Treat as if it does not exist.
      if (existingUserId !== userId) {
        await deleteByTypeAndTypeId(existingUserId, type, idOverride);
      } else {
        const setOperations: string[] = [];
        const removeOperations: string[] = [];
        const updateKeys = {};
        const updateValues = {};
        const updateObject = { ...data, GS1PK, GS2PK, GS3PK };
        Object.keys(updateObject).forEach((key, idx) => {
          if (updateObject[key] === undefined) return;
          const keyPlaceholder = `#k${idx}`;
          const valuePlaceholder = `:v${idx}`;
          if (updateObject[key] === null) {
            removeOperations.push(keyPlaceholder);
            updateKeys[keyPlaceholder] = key;
            return;
          }
          setOperations.push(`${keyPlaceholder} = ${valuePlaceholder}`);
          updateKeys[keyPlaceholder] = key;
          updateValues[valuePlaceholder] = updateObject[key];
        });
        let updateExpression = '';
        if (setOperations.length > 0) {
          updateExpression += `set ${setOperations.join(', ')}`;
        }
        if (removeOperations.length > 0) {
          updateExpression += `remove ${removeOperations.join(', ')}`;
        }
        if (updateExpression !== '') {
          const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
            Key: {
              PK: existingItem.PK,
              SK: existingItem.SK,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: updateKeys,
            ExpressionAttributeValues:
              Object.keys(updateValues).length === 0 ? undefined : updateValues,
            ReturnValues: 'ALL_NEW',
          };
          const updatedAttributes = await docClient.update(params).promise();
          newObj = updatedAttributes.Attributes || {};
        } else {
          newObj = existingItem;
        }
        return {
          existing: true,
          newObj,
        } as CreateOrUpdateReturn<T>;
      }
    }
  }
  // Create new item
  const id = idOverride || nanoid();
  const ts = tsOverride || microtime.now();
  const PK = `user#${userId}`;
  const SK = `${type}#${ts}`;
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    Item: {
      PK,
      SK,
      GS1PK: GS1PK || `${type}#${id}`,
      GS2PK,
      GS3PK,
      ts,
      ...data,
    },
    ConditionExpression: '#kPK <> :vPK AND #kSK <> :vSK',
    ExpressionAttributeNames: { '#kPK': 'PK', '#kSK': 'SK' },
    ExpressionAttributeValues: { ':vPK': PK, ':vSK': SK },
  };
  const rst = await docClient.put(params).promise();
  console.log(rst);
  return {
    existing: false,
    newObj: params.Item,
  } as CreateOrUpdateReturn<T>;
};

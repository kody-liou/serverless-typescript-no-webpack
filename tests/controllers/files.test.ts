import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

const url = `http://localhost:${process.env.PORT || 7070}`;

it('get put file url and upload file', async () => {
  jest.setTimeout(30000000);
  const response1 = await axios.put(`${url}/files/signed-url`, null, {
    params: { fileName: 'testFile', fileExt: 'jpg' },
  });
  expect(response1.status).toEqual(200);
  expect(response1.data).toMatch(/https:\//);
  console.log('!!!!!!!!!!!!!');
  const filePath = path.resolve(__dirname, '../assets/IMG20201004134009.jpg');
  console.log(filePath);
  const buffer = fs.readFileSync(filePath);
  const config: AxiosRequestConfig<Buffer> = {
    method: 'put',
    url: response1.data,
    headers: {
      'Content-Type': 'image/jpeg',
    },
    data: buffer,
  };
  const response2 = await axios(config);
  expect(response2.status).toEqual(200);
});

it('get download file url', async () => {
  const res = await axios.get(`${url}/files/signed-url`, {
    params: { fileName: 'testFile', fileExt: 'jpg' },
  });
  expect(res.status).toEqual(200);
  expect(res.data).toMatch(/https:\//);
});

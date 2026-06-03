import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,        // virtual users
  duration: '30s',
};

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoibmVnbUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODA0OTM3OTksImV4cCI6MTc4MDUxNTM5OX0.LnB52pNxEIsEkNqrwLouVO4jWNphUmcva4wJiZp4vGc';

export default function () {
  const res = http.get('http://localhost:8000/products', {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  check(res, { 'status 200': (r) => r.status === 200 });
}
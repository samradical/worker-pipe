import { generateJson } from 'json-generator'
const intensityMap = {
  1: {
    children: 1,
    jobs: 2,
    people: 1,
  },
  2: {
    children: 4,
    jobs: 6,
    people: 2,
  },
  3: {
    children: 8,
    jobs: 24,
    people: 4,
  },
  4: {
    children: 16,
    jobs: 48,
    people: 6,
  },
  5: {
    children: 32,
    jobs: 96,
    people: 12,
  },
  6: {
    children: 64,
    jobs: 192,
    people: 24,
  },
  7: {
    children: 128,
    jobs: 384,
    people: 48,
  },
  8: {
    children: 256,
    jobs: 768,
    people: 96,
  },
}
export type Intensities = keyof typeof intensityMap
export function doSomeSmallWork(i: Intensities) {
  let s = performance.now()
  const payload = generateJson({
    id: 'id;objectId',
    children: [
      intensityMap[i].children,
      {
        name: 'fullName',
        age: 'int;0;10',
      },
    ],
    currentJob: {
      title: 'Developer',
      salary: 'mask;',
    },
    jobs: [
      intensityMap[i].jobs,
      {
        title: 'random;["developer", "medic", "teacher", "CEO"]',
        salary: 'money',
        people: [
          intensityMap[i].people,
          {
            name: 'fullName',
            age: 'int;0;10',
            personalities: [
              3,
              {
                title:
                  'random;["introvert", "leader", "scientist", "cowgirl"]',
              },
            ],
          },
        ],
      },
    ],
    maxRunDistance: 'float;1;20;1',
    cpf: 'cpf',
    cnpj: 'cnpj',
    pretendSalary: 'money',
    age: 'int;20;80',
    gender: 'gender',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'maskInt;+55 (83) 9####-####',
    address: 'address',
    hairColor: 'color',
  })

  return JSON.stringify({
    timestamp: performance.now(),
    timeToGenerate: performance.now() - s,
    payload,
  })
}

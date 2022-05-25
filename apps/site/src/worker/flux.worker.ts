import {
  fromReadableStream,
  toWritableStream,
} from '@rxjs-ninja/rxjs-utility'
import {
  BehaviorSubject,
  interval,
  merge,
  Subject,
  timer,
} from 'rxjs'
import {
  filter,
  map,
  switchMap,
  takeUntil,
  repeat,
  tap,
  distinctUntilChanged,
} from 'rxjs/operators'
import { generateJson } from 'json-generator'

const ctx: Worker = self as any

function doSomeWork() {
  const payload = generateJson({
    id: 'id;objectId',
    children: [
      50,
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
      20,
      {
        title: 'random;["developer", "medic", "teacher", "CEO"]',
        salary: 'money',
        people: [
          50,
          {
            name: 'fullName',
            age: 'int;0;10',
            personalities: [
              50,
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

  return JSON.stringify({ timestamp: performance.now(), payload })
}

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
}
type Intensities = keyof typeof intensityMap
function doSomeSmallWork(i: Intensities) {
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
    payload,
  })
}

function processFromMainThread() {
  return new TransformStream({
    start() {},
    transform(chunk, controller) {
      controller.enqueue(doSomeWork())
    },
    flush() {},
  })
}

interface State {
  intensity: Intensities
}

ctx.onmessage = (event) => {
  const [readable, writable] = event.data

  const toMainThread = new TransformStream()

  // transform input and write to output
  // readable.pipeThrough(processFromMainThread()).pipeTo(writable)

  const sendFluxData$ = new Subject<string>()
  const sendStatus$ = new Subject<string>()
  const controlInput$ = new BehaviorSubject(true)
  const controlOutpout$ = controlInput$.pipe(distinctUntilChanged())

  const pause$ = controlOutpout$.pipe(filter((c) => !c))
  const play$ = controlOutpout$.pipe(filter((c) => !!c))

  const state: State = {
    intensity: 1,
  }

  merge(
    // respond to commands
    fromReadableStream<string>(readable).pipe(
      tap((c) => {
        if (c === 'play' || c === 'pause') {
          controlInput$.next(c === 'play')
        } else {
          const [intesity] = c.split('_')[1]
          state.intensity = Number(intesity) as Intensities
          console.log(state.intensity)
        }
        sendStatus$.next(`ackknowledged: ${c}`)
      }),
    ),
    play$.pipe(
      switchMap(() =>
        timer(0, 16).pipe(
          map((val) => doSomeSmallWork(state.intensity)),
          tap((chunk) => sendFluxData$.next(chunk)),
          takeUntil(pause$),
        ),
      ),
    ),
    sendFluxData$.pipe(toWritableStream(toMainThread.writable)),
    // sendStatus$.pipe(toWritableStream(writable)),
  ).subscribe()

  //@ts-expect-error Transferable doesnnt include streams
  self.postMessage([toMainThread.readable], [toMainThread.readable])
}

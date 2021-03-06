import { mockMessageModels } from '@/domain/test'
import { noContent, ok, serverError } from '@/presentation/helpers/http/http-helper'
import { HttpRequest } from '@/presentation/protocols'
import { mockLoadMessages } from '@/presentation/test'
import faker from 'faker'
import MockDate from 'mockdate'
import { LoadMessagesController } from './load-messages-controller'
import { LoadMessages } from './load-messages-controller-protocols'

const mockRequest = (): HttpRequest => {
  const finalDate = faker.date.future()
  finalDate.setHours(23, 59, 59)
  return {
    query: {
      initialDate: faker.date.recent().toISOString(),
      finalDate: finalDate.toISOString(),
      read: false,
      limit: faker.random.number(10),
      offset: faker.random.number(10)
    }
  }
}

type SutTypes = {
  sut: LoadMessagesController
  loadMessagesStub: LoadMessages
}

const makeSut = (): SutTypes => {
  const loadMessagesStub = mockLoadMessages()
  const sut = new LoadMessagesController(loadMessagesStub)
  return {
    sut,
    loadMessagesStub
  }
}

describe('Load Messages Controller', () => {
  beforeAll(() => {
    MockDate.set(new Date())
  })

  afterAll(() => {
    MockDate.reset()
  })

  it('Should call LoadMessages with correct data', async () => {
    const { sut, loadMessagesStub } = makeSut()
    const loadSpy = jest.spyOn(loadMessagesStub, 'load')
    const httpRequest = mockRequest()
    await sut.handle(httpRequest)
    expect(loadSpy).toHaveBeenCalledWith({
      initialDate: httpRequest.query.initialDate,
      finalDate: httpRequest.query.finalDate,
      read: false,
      pagination: {
        limit: httpRequest.query.limit,
        offset: httpRequest.query.offset
      }
    })
  })

  it('Should return 500 if LoadMessages throws', async () => {
    const { sut, loadMessagesStub } = makeSut()
    jest.spyOn(loadMessagesStub, 'load').mockImplementationOnce(() => {
      throw new Error()
    })
    const httpResponse = await sut.handle(mockRequest())
    expect(httpResponse).toEqual(serverError(new Error()))
  })

  it('Should return 200 on success', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle(mockRequest())
    expect(httpResponse).toEqual(ok(mockMessageModels()))
  })

  it('Should return 204 if LoadMessages returns an empty array', async () => {
    const { sut, loadMessagesStub } = makeSut()
    jest.spyOn(loadMessagesStub, 'load').mockResolvedValueOnce([])
    const httpResponse = await sut.handle(mockRequest())
    expect(httpResponse).toEqual(noContent())
  })
})

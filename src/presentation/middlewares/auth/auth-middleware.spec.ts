import { AccessDeniedError } from '@/presentation/errors'
import { forbidden, noContent, unauthorized } from '@/presentation/helpers/http/http-helper'
import { mockLoadUserByToken } from '@/presentation/test'
import faker from 'faker'
import { AuthMiddleware } from './auth-middleware'
import { HttpRequest, LoadUserByToken } from './auth-middleware-protocols'

const mockRequest = (): HttpRequest => ({
  headers: {
    'x-access-token': faker.random.uuid()
  }
})

type SutTypes = {
  sut: AuthMiddleware
  loadUserByTokenStub: LoadUserByToken
}

const makeSut = (): SutTypes => {
  const loadUserByTokenStub = mockLoadUserByToken()
  const sut = new AuthMiddleware(loadUserByTokenStub)
  return {
    sut,
    loadUserByTokenStub
  }
}

describe('Auth Middleware', () => {
  it('Should return 401 if x-access-token is not provided on headers', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({})
    expect(httpResponse).toEqual(unauthorized())
  })

  it('Should call LoadUserByToken with correct accessToken', async () => {
    const { sut, loadUserByTokenStub } = makeSut()
    const loadByTokenSpy = jest.spyOn(loadUserByTokenStub, 'loadByToken')
    const httpRequest = mockRequest()
    await sut.handle(httpRequest)
    expect(loadByTokenSpy).toHaveBeenCalledWith(httpRequest.headers['x-access-token'])
  })

  it('Should return 403 if LoadUserByToken returns null', async () => {
    const { sut, loadUserByTokenStub } = makeSut()
    jest.spyOn(loadUserByTokenStub, 'loadByToken').mockResolvedValueOnce(null)
    const httpResponse = await sut.handle(mockRequest())
    expect(httpResponse).toEqual(forbidden(new AccessDeniedError()))
  })

  it('Should return 204 if LoadUserByToken returns an user', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle(mockRequest())
    expect(httpResponse).toEqual(noContent())
  })
})

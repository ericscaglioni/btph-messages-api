import faker from 'faker'
import jwt from 'jsonwebtoken'
import { JwtAdapter } from './jwt-adapter'

jest.mock('jsonwebtoken', () => ({
  async verify (): Promise<object> {
    return {
      id: 'any_user_id'
    }
  },
  async sign (): Promise<string> {
    return 'any_token'
  }
}))

const token = faker.random.uuid()

const randomSecret = faker.random.word()

const makeSut = (): JwtAdapter => new JwtAdapter(randomSecret)

describe('JWT Adapter', () => {
  describe('verify()', () => {
    it('Should call jwt verify with correct data', async () => {
      const sut = makeSut()
      const verifySpy = jest.spyOn(jwt, 'verify')
      await sut.decrypt(token)
      expect(verifySpy).toHaveBeenCalledWith(token, randomSecret)
    })

    it('Should throw if jwt verify throws', async () => {
      const sut = makeSut()
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error()
      })
      const promise = sut.decrypt(token)
      await expect(promise).rejects.toThrow()
    })

    it('Should return an userId on success', async () => {
      const sut = makeSut()
      const userId = await sut.decrypt(token)
      expect(userId).toBe('any_user_id')
    })
  })

  describe('sign()', () => {
    it('Should call sign with correct data', async () => {
      const sut = makeSut()
      const signSpy = jest.spyOn(jwt, 'sign')
      await sut.encrypt('any_id')
      expect(signSpy).toHaveBeenCalledWith({ id: 'any_id' }, randomSecret)
    })

    it('Should return a token on sign success', async () => {
      const sut = makeSut()
      const accessToken = await sut.encrypt('any_id')
      expect(accessToken).toBe('any_token')
    })

    it('Should throw if sign throws', async () => {
      const sut = makeSut()
      jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        throw new Error()
      })
      const promise = sut.encrypt('any_id')
      await expect(promise).rejects.toThrow()
    })
  })
})

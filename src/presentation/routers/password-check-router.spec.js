const PasswordCheckRouter = require('./password-check-router')
const { InvalidParamError, MissingParamError, ServerError } = require('../errors')

const makePasswordCheckUseCaseSpy = () => {
  class PasswordCheckUseCaseSpy {
    async check (password) {
      this.password = password

      return this.isValidPassword
    }
  }

  return new PasswordCheckUseCaseSpy()
}

const makePasswordCheckUseCaseSpyWithError = () => {
  class PasswordCheckUseCaseSpy {
    async check () {
      throw new Error()
    }
  }

  return new PasswordCheckUseCaseSpy()
}

const makePasswordValidator = () => {
  class PasswordValidatorSpy {
    isValid (password) {
      this.password = password
      return this.isPasswordValid
    }
  }

  const passwordValidatorSpy = new PasswordValidatorSpy()
  passwordValidatorSpy.isPasswordValid = true
  return passwordValidatorSpy
}

const makePasswordValidatorWithError = () => {
  class PasswordValidatorSpy {
    isValid (password) {
      throw new Error()
    }
  }

  return new PasswordValidatorSpy()
}

const makeSut = () => {
  const passwordCheckUseCaseSpy = makePasswordCheckUseCaseSpy()
  const passwordValidatorSpy = makePasswordValidator()
  passwordCheckUseCaseSpy.isValidPassword = true

  const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy, passwordValidatorSpy)

  return {
    sut,
    passwordCheckUseCaseSpy,
    passwordValidatorSpy
  }
}

describe('Password checker router', () => {
  test('Should return 400 if no password is provided', async () => {
    // sut = system under test
    const { sut } = makeSut()

    const httpRequest = {
      body: {
        password: ''
      }
    }

    const httpReponse = await sut.route(httpRequest)
    expect(httpReponse.statusCode).toBe(400)
    expect(httpReponse.body).toEqual(new MissingParamError('password'))
  })

  test('Should return 500 if no httpRequest is provided', async () => {
    const { sut } = makeSut()

    const httpResponse = await sut.route()
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if httpRequest has no body', async () => {
    const { sut } = makeSut()

    const httpRequest = {}

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should call PasswordCheckUseCase with correct params', async () => {
    const { sut, passwordCheckUseCaseSpy } = makeSut()

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    await sut.route(httpRequest)
    expect(passwordCheckUseCaseSpy.password).toBe(httpRequest.body.password)
  })

  test('Should return 500 if no PasswordCheckUseCase is provided', async () => {
    const sut = new PasswordCheckRouter()

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no PasswordCheckUseCase has no check method', async () => {
    // Re-creating spy class with no check method
    const passwordCheckUseCaseSpy = new PasswordCheckRouter({})
    const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy)

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if PasswordCheckUseCase throws ', async () => {
    const passwordCheckUseCaseSpy = makePasswordCheckUseCaseSpyWithError()
    passwordCheckUseCaseSpy.isValidPassword = true

    const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy)

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 400 if an invalid password is provided ', async () => {
    const { sut, passwordValidatorSpy } = makeSut()
    passwordValidatorSpy.isPasswordValid = false

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('password'))
  })

  test('Should return 500 if no PasswordValidator is provided', async () => {
    const passwordCheckUseCaseSpy = makePasswordCheckUseCaseSpy()
    const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy)

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if PasswordValidator has no isValid method', async () => {
    const passwordCheckUseCaseSpy = makePasswordCheckUseCaseSpy()
    // Re-creating spy class no isValid method
    const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy, {})

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if PasswordValidator throws ', async () => {
    const passwordCheckUseCaseSpy = makePasswordCheckUseCaseSpy()
    const passwordValidatorSpy = makePasswordValidatorWithError()

    const sut = new PasswordCheckRouter(passwordCheckUseCaseSpy, passwordValidatorSpy)

    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 200 when valid password are provided', async () => {
    const { sut, passwordCheckUseCaseSpy } = makeSut()

    const httpRequest = {
      body: {
        password: 'valid_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body.isValidPassword).toEqual(passwordCheckUseCaseSpy.isValidPassword)
  })

  test('Should call PasswordValidator with correct password', async () => {
    const { sut, passwordValidatorSpy } = makeSut()

    const httpRequest = {
      body: {
        password: 'valid_password'
      }
    }

    await sut.route(httpRequest)
    expect(passwordValidatorSpy.password).toEqual(httpRequest.body.password)
  })
})

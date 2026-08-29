import { test, expect } from '@playwright/test'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import fs from 'fs'

test.describe('Teste de contrato - Usuário', () => {

  const ajv = new Ajv2020()

  addFormats(ajv)

  test('deve validar o contrato da API de usuário', async ({ request }) => {

    const schema = JSON.parse(
      fs.readFileSync('schemas/usuario.schema.json', 'utf-8')
    )

    const response = await request.get(
      'https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1'
    )

    expect(response.status()).toBe(200)

    const responseBody = await response.json()

    const validate = ajv.compile(schema)

    const valid = validate(responseBody)

    expect(
      valid,
      `Contrato inválido: ${JSON.stringify(validate.errors, null, 2)}`
    ).toBe(true)
  })
})
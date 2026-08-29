import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

describe('Teste de contrato - Usuário', () => {
  const ajv = new Ajv2020()

  addFormats(ajv)

  it('deve validar o contrato da API de usuário', () => {
    cy.fixture('schemas/usuario.schema.json').then((schema) => {
      cy.request({
        method: 'GET',
        url: 'https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1'
      }).then((response) => {
        expect(response.status).to.eq(200)

        const validate = ajv.compile(schema)
        const valid = validate(response.body)

        expect(
          valid,
          `Contrato inválido: ${JSON.stringify(validate.errors, null, 2)}`
        ).to.be.true
      })
    })
  })
})
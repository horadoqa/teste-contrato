# Contrato

No contexto de APIs e testes de contrato, um contrato é um acordo que define como dois sistemas devem se comunicar.

Por exemplo, imagine:

CONSUMIDOR                         PROVEDOR
Sistema de Cadastro  ──────────>  ServeRest
                       contrato


O contrato pode dizer:

Método: POST
Endpoint: /usuarios
Request: quais campos devem ser enviados
Tipos dos campos: nome é string, email é string, etc.
Status esperado: 201
Response: quais campos devem ser retornados
Tipos da resposta: message é string, _id é string
Exemplo

O consumidor espera enviar:

{
  "nome": "João",
  "email": "joao@email.com",
  "password": "123456",
  "administrador": "true"
}


E espera receber:

{
  "message": "Cadastro realizado com sucesso",
  "_id": "abc123"
}


O contrato registra essas expectativas.

Então, nos testes de contrato, a ideia é:

valida
CONSUMIDORDefine expectativas
CONTRATORegistra expectativas
PROVEDORServeRest

Se o ServeRest mudar a API e, por exemplo, deixar de retornar _id, o teste de contrato pode detectar essa quebra antes que ela cause problemas no consumidor.

Em uma frase:

Contrato é o acordo sobre o formato e o comportamento esperado na comunicação entre consumidor e provedor.
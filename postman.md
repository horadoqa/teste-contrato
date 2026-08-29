# Teste de contrato de API com POSTMAN

Validando o Json do response de forma automática, usando o endpoint de usuário do ServeRest.

O ServeRest é justamente voltado para estudos de testes de API e possui suporte a testes de **JSON Schema**. ([ServeRest][1])

## 1. Primeiro, vamos entender o que estamos testando

Faremos um `GET`:

```bash
curl https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1
```

A resposta é:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

O objetivo do **JSON Schema** será dizer:

> "Eu espero que a resposta tenha essa estrutura e que cada campo tenha determinado tipo."

---

# 2. O que é JSON Schema?

Pense no JSON Schema como um **contrato**.

Por exemplo:

```text
nome          → precisa existir e ser string
email         → precisa existir e ser string
password      → precisa existir e ser string
administrador → precisa existir e ser string
_id           → precisa existir e ser string
```

Isso é diferente de testar apenas:

```javascript
pm.response.code === 200
```

O status `200` diz que a requisição funcionou.

O Schema verifica se **o conteúdo retornado está de acordo com o contrato esperado**.

---

# 3. Criando nosso primeiro Schema

Para esse retorno, podemos começar com:

```json
{
  "type": "object",
  "required": [
    "nome",
    "email",
    "password",
    "administrador",
    "_id"
  ],
  "properties": {
    "nome": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "administrador": {
      "type": "string"
    },
    "_id": {
      "type": "string"
    }
  }
}
```

Observe uma coisa importante:

```json
"administrador": {
  "type": "string"
}
```

Apesar de representar algo que parece booleano, o retorno do ServeRest é:

```json
"administrador": "true"
```

e não:

```json
"administrador": true
```

Portanto, **nesse contrato específico, o tipo é `string`**. A documentação do ServeRest também mostra `administrador` dessa forma no exemplo de usuário. ([UNPKG][2])

---

# 4. Testando no Postman

Agora vamos transformar isso em um teste automatizado.

Crie uma requisição:

```text
GET
https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1
```

Depois vá em:

```text
Scripts
   ↓
Post-response
```

E coloque:

```javascript
const schema = {
    type: "object",
    required: [
        "nome",
        "email",
        "password",
        "administrador",
        "_id"
    ],
    properties: {
        nome: {
            type: "string"
        },
        email: {
            type: "string"
        },
        password: {
            type: "string"
        },
        administrador: {
            type: "string"
        },
        _id: {
            type: "string"
        }
    }
};

pm.test("A resposta deve seguir o JSON Schema", function () {
    pm.response.to.have.jsonSchema(schema);
});
```

Agora execute a requisição.

---

# 5. O que o teste está fazendo?

Vamos separar:

### Primeiro:

```javascript
const schema = {
```

Criamos nosso contrato.

### Depois:

```javascript
type: "object"
```

Estamos dizendo:

> A resposta inteira precisa ser um objeto JSON.

Ou seja, esperamos:

```json
{
  "nome": "...",
  "email": "..."
}
```

e não:

```json
[
  {
    "nome": "..."
  }
]
```

---

# 6. `required`

Temos:

```javascript
required: [
    "nome",
    "email",
    "password",
    "administrador",
    "_id"
]
```

Isso significa que esses campos **precisam existir**.

Por exemplo, esta resposta:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true"
}
```

seria **inválida**, porque está faltando:

```text
_id
```

Esse é um dos grandes benefícios do Schema: não estamos apenas verificando valores específicos, mas a **estrutura esperada da resposta**.

---

# 7. `properties`

Agora temos:

```javascript
properties: {
```

Aqui definimos as propriedades e seus tipos.

Por exemplo:

```javascript
nome: {
    type: "string"
}
```

Significa:

```text
nome
 ↓
precisa ser string
```

Então isto é válido:

```json
{
    "nome": "Fulano da Silva"
}
```

Mas isto não:

```json
{
    "nome": 123
}
```

---

# 8. Vamos melhorar o teste

Até agora estamos validando apenas o tipo.

Podemos adicionar regras mais interessantes.

Por exemplo, para o e-mail:

```javascript
email: {
    type: "string",
    format: "email"
}
```

E para `nome`:

```javascript
nome: {
    type: "string",
    minLength: 1
}
```

Nosso Schema fica:

```javascript
const schema = {
    type: "object",

    required: [
        "nome",
        "email",
        "password",
        "administrador",
        "_id"
    ],

    properties: {
        nome: {
            type: "string",
            minLength: 1
        },

        email: {
            type: "string",
            format: "email"
        },

        password: {
            type: "string",
            minLength: 1
        },

        administrador: {
            type: "string"
        },

        _id: {
            type: "string",
            minLength: 1
        }
    }
};

pm.test("A resposta deve seguir o JSON Schema", function () {
    pm.response.to.have.jsonSchema(schema);
});
```

Agora temos um contrato muito melhor.

---

# 9. Podemos testar o conteúdo também?

Sim, mas aqui existe uma diferença importante.

### JSON Schema

Verifica coisas como:

```text
O campo existe?
É string?
É número?
É boolean?
Tem tamanho mínimo?
Segue determinado formato?
```

### Teste funcional

Pode verificar:

```text
nome deve ser "Fulano da Silva"
email deve ser "fulano@qa.com"
_id deve ser "0uxuPY0cbmQhpEz1"
```

Por exemplo:

```javascript
pm.test("O nome deve ser Fulano da Silva", function () {
    const response = pm.response.json();

    pm.expect(response.nome).to.eql("Fulano da Silva");
});
```

Ou:

```javascript
pm.test("O status deve ser 200", function () {
    pm.response.to.have.status(200);
});
```

Então podemos ter **vários níveis de validação**.

---

# 10. Um teste mais completo

Eu usaria algo parecido com este para nosso exemplo:

```javascript
const schema = {
    type: "object",

    required: [
        "nome",
        "email",
        "password",
        "administrador",
        "_id"
    ],

    properties: {
        nome: {
            type: "string",
            minLength: 1
        },

        email: {
            type: "string",
            format: "email"
        },

        password: {
            type: "string",
            minLength: 1
        },

        administrador: {
            type: "string"
        },

        _id: {
            type: "string",
            minLength: 1
        }
    }
};


pm.test("Status code deve ser 200", function () {
    pm.response.to.have.status(200);
});


pm.test("Resposta deve seguir o JSON Schema", function () {
    pm.response.to.have.jsonSchema(schema);
});


pm.test("Nome deve ser Fulano da Silva", function () {
    const response = pm.response.json();

    pm.expect(response.nome).to.eql("Fulano da Silva");
});


pm.test("Email deve ser fulano@qa.com", function () {
    const response = pm.response.json();

    pm.expect(response.email).to.eql("fulano@qa.com");
});


pm.test("ID deve ser o esperado", function () {
    const response = pm.response.json();

    pm.expect(response._id).to.eql("0uxuPY0cbmQhpEz1");
});
```

Agora temos:

```text
                 TESTE DA API
                      │
          ┌───────────┴───────────┐
          │                       │
      Status 200             JSON Schema
                                  │
                         ┌────────┼────────┐
                         │        │        │
                       Campos   Tipos    Formatos
                         │        │        │
                         └────────┼────────┘
                                  │
                         Testes funcionais
                                  │
                       Valores específicos
```

---

# 11. Agora vem a parte mais importante: fazer o teste falhar

Um bom teste de Schema não é apenas aquele que passa.

Precisamos provar que ele **detecta problemas**.

Imagine que a API retornasse:

```json
{
    "nome": 123,
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

Nosso Schema espera:

```javascript
nome: {
    type: "string"
}
```

Mas recebeu:

```text
123
```

que é `number`.

Portanto:

**❌ Schema inválido**

---

# 12. Outro exemplo

Imagine que a API retornasse:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true"
}
```

O teste também deveria falhar.

Por quê?

Porque definimos:

```javascript
required: [
    "nome",
    "email",
    "password",
    "administrador",
    "_id"
]
```

E `_id` não está presente.

**❌ Schema inválido**

---

# 13. Mais um exemplo

Imagine:

```json
{
    "nome": "Fulano da Silva",
    "email": "email-invalido",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

Como colocamos:

```javascript
email: {
    type: "string",
    format: "email"
}
```

o Schema pode identificar que o valor não segue o formato esperado de e-mail.

**❌ Schema inválido**

---

# 14. O que estamos aprendendo de verdade?

O conceito mais importante é este:

> **JSON Schema testa o contrato da resposta, não apenas o valor da resposta.**

Imagine que amanhã o backend mude:

De:

```json
"administrador": "true"
```

para:

```json
"administrador": true
```

Isso pode representar uma mudança importante no contrato.

Nosso teste:

```javascript
administrador: {
    type: "string"
}
```

vai falhar.

E isso é **bom**.

O teste está nos avisando:

> ⚠️ "A API mudou o formato do dado que eu esperava receber."

---

## 15. Uma evolução interessante para estudar

Eu sugiro estudar JSON Schema nessa ordem:

```text
1. type
   ↓
2. required
   ↓
3. properties
   ↓
4. minLength / maxLength
   ↓
5. format
   ↓
6. enum
   ↓
7. pattern
   ↓
8. arrays
   ↓
9. objetos aninhados
   ↓
10. additionalProperties
```

Depois podemos pegar o **mesmo endpoint do ServeRest** e fazer um exercício prático em que criamos **5 versões propositalmente erradas da resposta** e fazemos o Postman detectar cada problema.

A documentação oficial do ServeRest confirma que o projeto é voltado justamente ao estudo de testes de API e inclui **teste de schema JSON** entre os recursos. ([ServeRest][1])

[1]: https://serverest.dev/?utm_source=chatgpt.com "ServeRest"
[2]: https://unpkg.com/serverest%402.22.1/docs/serverest.dev.html?utm_source=chatgpt.com "ServeRest"

# Teste de Contrato de APIs com JSON Schema: do conceito à automação

Em projetos modernos, as APIs são responsáveis por conectar aplicações, serviços e sistemas diferentes. Quando um desses sistemas muda o formato de uma resposta sem avisar os consumidores, podemos ter um problema sério: funcionalidades que antes funcionavam deixam de funcionar.

É nesse contexto que entra o **Teste de Contrato**.

Uma das formas mais simples de começar a trabalhar com contratos de API é utilizando **JSON Schema** para definir e validar a estrutura das respostas.

Neste artigo, vamos entender o conceito de Teste de Contrato, criar um JSON Schema e utilizá-lo para validar uma API real utilizando o [ServeRest](https://serverest.dev/). Também veremos diferentes ferramentas que podem ser utilizadas para automatizar esse tipo de teste.

---

## O que é Teste de Contrato?

O Teste de Contrato tem como objetivo verificar se uma API está respeitando o contrato que foi definido para sua comunicação com outros sistemas.

Imagine que uma aplicação consuma o seguinte endpoint:

```http
GET https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1
```

E a API retorne:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

Para quem consome essa API, existe uma expectativa sobre essa resposta.

Por exemplo:

* `nome` deve existir;
* `nome` deve ser uma string;
* `email` deve existir;
* `email` deve possuir um formato válido;
* `_id` deve existir;
* `_id` deve ser uma string;
* `administrador` deve possuir o tipo esperado.

Essas regras podem ser transformadas em um contrato.

---

# O que é JSON Schema?

JSON Schema é uma especificação utilizada para descrever e validar a estrutura de documentos JSON.

Podemos pensar nele como um contrato:

```text
API
 │
 │ resposta JSON
 ▼
JSON Schema
 │
 ├── Campos obrigatórios
 ├── Tipos
 ├── Formatos
 ├── Tamanhos
 └── Regras
```

Por exemplo:

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

Esse Schema está dizendo:

> "Espero receber um objeto contendo esses cinco campos e cada campo precisa respeitar o tipo definido."

---

# Schema não é a mesma coisa que validar valores

Essa diferença é importante.

Podemos ter um teste como:

```javascript
pm.expect(response.nome).to.eql("Fulano da Silva");
```

Nesse caso estamos validando um **valor específico**.

Já no JSON Schema:

```json
"nome": {
  "type": "string"
}
```

estamos validando a **estrutura e o tipo**.

Portanto:

```text
Teste funcional
        │
        └── "nome" deve ser "Fulano da Silva"

Teste de contrato
        │
        └── "nome" deve existir e ser uma string
```

Os dois tipos de teste são importantes e se complementam.

---

# Criando nosso primeiro contrato

Para o endpoint do ServeRest, podemos criar o arquivo:

```text
usuario-schema.json
```

Com o seguinte conteúdo:

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
      "type": "string",
      "minLength": 1
    },

    "email": {
      "type": "string",
      "format": "email"
    },

    "password": {
      "type": "string",
      "minLength": 1
    },

    "administrador": {
      "type": "string"
    },

    "_id": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

Agora temos um contrato mais completo.

Além dos tipos, estamos definindo algumas regras:

```text
nome
 └── string
 └── pelo menos 1 caractere

email
 └── string
 └── formato de e-mail

password
 └── string
 └── pelo menos 1 caractere

administrador
 └── string

_id
 └── string
 └── pelo menos 1 caractere
```

---

# Uma observação importante sobre tipos

Observe o campo:

```json
"administrador": "true"
```

Ele é uma string.

Não é a mesma coisa que:

```json
"administrador": true
```

No primeiro caso:

```text
"true" → string
```

No segundo:

```text
true → boolean
```

Portanto, nosso Schema precisa representar exatamente o contrato que a API fornece.

Se a API mudar de:

```json
"administrador": "true"
```

para:

```json
"administrador": true
```

nosso teste deverá identificar essa mudança.

E isso é justamente uma das vantagens do Teste de Contrato.

---

# Testando o contrato no Ubuntu

Uma das possibilidades é criar os testes utilizando Python.

Primeiro instalamos as ferramentas necessárias:

```bash
sudo apt update
sudo apt install -y curl python3 python3-pip
```

Depois podemos instalar a biblioteca `jsonschema`:

```bash
pip3 install jsonschema
```

Caso o Ubuntu esteja utilizando um ambiente que bloqueie a instalação global do `pip`, podemos utilizar um ambiente virtual:

```bash
python3 -m venv venv
source venv/bin/activate
pip install jsonschema
```

---

# Testando a API com curl

Antes de automatizar o teste, podemos consultar a API:

```bash
curl https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1
```

Podemos também formatar a resposta:

```bash
curl -s https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1 | python3 -m json.tool
```

Isso nos permite verificar manualmente o retorno da API.

Mas ainda não temos um teste automatizado.

---

# Criando o teste em Python

Podemos criar:

```text
test_schema.py
```

Com:

```python
import json
import urllib.request
from jsonschema import validate
from jsonschema.exceptions import ValidationError


URL = "https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1"


with open("usuario-schema.json", "r") as file:
    schema = json.load(file)


with urllib.request.urlopen(URL) as response:
    status_code = response.status
    body = response.read().decode("utf-8")


data = json.loads(body)


assert status_code == 200, (
    f"Status esperado: 200, recebido: {status_code}"
)

print("✓ Status code: 200")


try:
    validate(instance=data, schema=schema)
    print("✓ JSON Schema válido")

except ValidationError as error:
    print("✗ JSON Schema inválido")
    print(error.message)
    exit(1)


assert data["nome"] == "Fulano da Silva"
print("✓ Nome correto")


assert data["email"] == "fulano@qa.com"
print("✓ Email correto")


assert data["_id"] == "0uxuPY0cbmQhpEz1"
print("✓ ID correto")


print("\nTodos os testes passaram!")
```

Executamos:

```bash
python3 test_schema.py
```

E teremos algo parecido com:

```text
✓ Status code: 200
✓ JSON Schema válido
✓ Nome correto
✓ Email correto
✓ ID correto

Todos os testes passaram!
```

---

# O que realmente está acontecendo?

A linha mais importante do teste é:

```python
validate(instance=data, schema=schema)
```

Temos:

```text
                API
                 │
                 ▼
           JSON Response
                 │
                 ▼
              data
                 │
                 ▼
        JSON Schema
                 │
                 ▼
             validate
              /     \
             /       \
          válido    inválido
             │          │
             ▼          ▼
             ✓          ✗
```

O JSON retornado pela API é comparado com o contrato.

Se estiver de acordo:

```text
✓ JSON Schema válido
```

Se houver uma incompatibilidade:

```text
✗ JSON Schema inválido
```

---

# E se o contrato for quebrado?

Essa é uma das partes mais importantes do teste.

Vamos imaginar que a API retorne:

```json
{
    "nome": 123,
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

Mas nosso contrato determina:

```json
"nome": {
    "type": "string"
}
```

O teste identificará:

```text
'123' is not of type 'string'
```

Ou seja:

```text
Contrato
   │
   └── nome → string

API
   │
   └── nome → number

Resultado
   │
   └── ✗ Falha
```

---

# E se faltar um campo?

Nosso Schema possui:

```json
"required": [
    "nome",
    "email",
    "password",
    "administrador",
    "_id"
]
```

Imagine que a API retorne:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true"
}
```

O campo `_id` desapareceu.

O teste deverá falhar porque `_id` está definido como obrigatório.

Resultado:

```text
'_id' is a required property
```

Esse é um ótimo exemplo de como o Teste de Contrato pode detectar alterações inesperadas na API.

---

# Diferentes formas de testar JSON Schema

Não existe apenas uma ferramenta para realizar esse tipo de teste.

Dependendo da tecnologia e da estratégia do projeto, podemos utilizar diferentes soluções.

## Postman

É uma das formas mais simples de começar.

No Postman podemos utilizar:

```javascript
pm.test("A resposta deve seguir o JSON Schema", function () {
    pm.response.to.have.jsonSchema(schema);
});
```

É uma ótima opção para QA que já trabalha com testes de API no Postman.

---

## Newman

O Newman permite executar collections do Postman pela linha de comando.

Por exemplo:

```bash
newman run collection.json
```

Isso permite levar os testes criados no Postman para um pipeline de CI/CD.

Podemos ter:

```text
Git
 │
 ▼
CI/CD
 │
 ▼
Newman
 │
 ▼
Postman Collection
 │
 ▼
API
 │
 ▼
JSON Schema
```

---

# Pytest + jsonschema

Para projetos Python, uma combinação bastante interessante é:

```text
Pytest
+
jsonschema
```

O teste pode evoluir para uma estrutura:

```text
tests/
├── schemas/
│   └── usuario.json
│
├── test_usuarios.py
└── requirements.txt
```

E ser executado com:

```bash
pytest -v
```

Isso permite construir uma suíte de testes de API mais organizada.

---

# REST Assured

No ecossistema Java, uma alternativa muito conhecida é o REST Assured.

A ideia pode ser representada por:

```java
given()
    .when()
    .get("/usuarios/0uxuPY0cbmQhpEz1")
    .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("usuario.json"));
```

É uma alternativa interessante para equipes que trabalham com:

```text
Java
JUnit
Maven/Gradle
REST Assured
```

---

# Ajv

Para projetos JavaScript ou TypeScript, podemos utilizar o Ajv, um validador de JSON Schema para JavaScript.

A ideia é:

```text
Node.js
   │
   ▼
API
   │
   ▼
JSON
   │
   ▼
Ajv
   │
   ▼
JSON Schema
```

E então verificar se o JSON recebido é válido de acordo com o contrato.

Essa abordagem é interessante quando a equipe já trabalha com Node.js, Jest ou Vitest.

---

# Karate

Outra opção é o Karate.

Ele combina testes de API, assertions, JSON e outros recursos em uma abordagem bastante voltada para automação de testes.

É especialmente interessante para equipes que querem uma solução mais completa para testes de API sem precisar escrever grandes quantidades de código Java.

---

# Dredd

O Dredd trabalha com uma abordagem mais orientada ao contrato da API.

A ideia é comparar o comportamento da API com uma especificação.

Podemos imaginar:

```text
Contrato da API
      │
      ▼
    Dredd
      │
      ▼
 API real
      │
      ▼
Comparação
```

É particularmente interessante quando trabalhamos com especificações como OpenAPI.

---

# SoapUI

O SoapUI também pode ser utilizado para testes de APIs REST.

É uma opção interessante para equipes que preferem uma ferramenta com interface gráfica e uma abordagem tradicional de criação de testes.

---

# JSON Schema x Contract Testing

É importante entender que JSON Schema e Teste de Contrato não são exatamente a mesma coisa.

JSON Schema é uma tecnologia para **descrever e validar a estrutura de um JSON**.

Já Contract Testing é uma estratégia mais ampla.

Podemos pensar:

```text
                 Contract Testing
                       │
          ┌────────────┼────────────┐
          │            │            │
       Schema       OpenAPI        Pact
          │            │            │
          └────────────┼────────────┘
                       │
                    Testes
```

O JSON Schema pode ser uma peça do nosso contrato.

---

# Contract Testing tradicional x Consumer-Driven Contract Testing

Também existe uma distinção importante.

Em um teste simples de Schema, podemos dizer:

> "A API deve retornar um JSON com essa estrutura."

Já em uma abordagem **Consumer-Driven Contract Testing**, o consumidor participa da definição do contrato.

Por exemplo:

```text
Frontend
   │
   │ contrato
   ▼
Backend
```

O consumidor define aquilo que espera do provedor.

Ferramentas como Pact são bastante utilizadas nesse tipo de estratégia.

---

# Por que testar contratos?

Imagine que um backend altere:

```json
"administrador": "true"
```

para:

```json
"administrador": true
```

Para um desenvolvedor, pode parecer uma alteração pequena.

Mas para um consumidor que espera uma string:

```javascript
response.administrador === "true"
```

o comportamento mudou.

Sem um teste de contrato, essa alteração pode chegar até produção.

Com o teste:

```text
Alteração
   │
   ▼
Teste de contrato
   │
   ▼
Falha
   │
   ▼
Problema identificado antes do deploy
```

É exatamente esse tipo de problema que queremos evitar.

---

# O papel do Teste de Contrato no CI/CD

Uma das maiores vantagens da automação é poder executar os testes a cada alteração.

Por exemplo:

```text
Developer
    │
    ▼
git push
    │
    ▼
CI/CD
    │
    ▼
Testes de API
    │
    ▼
JSON Schema
    │
 ┌──┴──┐
 ▼     ▼
✓      ✗
 │      │
 ▼      ▼
Deploy  Bloqueado
```

Dessa forma, uma alteração incompatível com o contrato pode impedir o avanço do pipeline.

---

# Qual ferramenta escolher?

Não existe uma resposta única.

Uma estratégia simples seria:

### Para começar

**Postman**

É fácil de visualizar e permite aprender o conceito de forma rápida.

### Para automatizar Postman

**Newman**

Permite executar as collections no terminal e em CI/CD.

### Para Python

**Pytest + jsonschema**

Uma excelente combinação para criar uma suíte de testes estruturada.

### Para Java

**REST Assured**

Muito utilizado em automação de APIs.

### Para JavaScript/TypeScript

**Ajv**

Uma excelente alternativa para validação de JSON Schema.

### Para uma abordagem mais ampla

**Karate**

Pode ser interessante quando queremos uma ferramenta completa para testes de API.

### Para Consumer-Driven Contracts

**Pact**

Quando a necessidade vai além da validação da estrutura JSON e envolve contratos entre consumidores e provedores.

---

# Conclusão

Teste de Contrato é uma estratégia importante para garantir que APIs continuem respeitando aquilo que seus consumidores esperam.

O JSON Schema fornece uma maneira simples e poderosa de definir regras para a estrutura das respostas.

No nosso exemplo, transformamos:

```json
{
    "nome": "Fulano da Silva",
    "email": "fulano@qa.com",
    "password": "teste",
    "administrador": "true",
    "_id": "0uxuPY0cbmQhpEz1"
}
```

em um contrato que define:

```text
✓ Campos obrigatórios
✓ Tipos
✓ Formatos
✓ Tamanho mínimo
✓ Estrutura
```

Depois, esse contrato pode ser utilizado em diferentes ferramentas:

```text
              JSON Schema
                   │
       ┌───────────┼───────────┐
       │           │           │
    Postman     Pytest       REST Assured
       │           │           │
    Newman       Python        Java
       │           │           │
       └───────────┼───────────┘
                   │
                 CI/CD
```

O mais importante não é escolher uma ferramenta específica, mas entender o princípio:

> **A API possui um contrato. O teste verifica se a API continua respeitando esse contrato.**

Quando incorporamos essa validação ao pipeline de CI/CD, conseguimos detectar alterações incompatíveis muito antes que elas cheguem aos usuários.

E esse é um dos principais objetivos do Teste de Contrato: **detectar quebras de integração antes que elas se transformem em problemas reais.**

Se quiser, posso também transformar esse artigo em uma versão **mais técnica e voltada para QA/automação**, com exemplos completos de Postman, Newman, Pytest e REST Assured, incluindo uma seção de **JSON Schema na prática** e exercícios para o leitor.

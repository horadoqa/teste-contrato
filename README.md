# Teste de contrato de API

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

- [Postman](./postman.md)
- [shell script]()

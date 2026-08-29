# Teste de contrato de API com PYTHON

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

Vou usar **Python**, porque já é muito comum em ambientes Linux e deixa o exemplo fácil de entender.

## 1. Instalar as ferramentas

No Ubuntu:

```bash
sudo apt update
sudo apt install -y curl python3 python3-pip
```

Depois instalamos o validador JSON Schema:

```bash
pip3 install jsonschema
```

Se o Ubuntu bloquear a instalação global via `pip`, use um ambiente virtual:

```bash
python3 -m venv venv
source venv/bin/activate
pip install jsonschema
```

---

## 2. Criar o JSON Schema

Crie uma pasta para o teste:

```bash
mkdir teste-schema
cd teste-schema
```

Agora:

```bash
nano usuario-schema.json
```

Coloque:

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

Salve com:

```text
CTRL + O
ENTER
CTRL + X
```

---

## 3. Testar a API com curl

Agora vamos primeiro verificar o retorno da API:

```bash
curl https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1
```

Você deverá receber algo parecido com:

```json
{
  "nome": "Fulano da Silva",
  "email": "fulano@qa.com",
  "password": "teste",
  "administrador": "true",
  "_id": "0uxuPY0cbmQhpEz1"
}
```

Podemos deixar o JSON mais bonito usando Python:

```bash
curl -s https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1 | python3 -m json.tool
```

---

# 4. Criar o teste automatizado

Agora vamos criar:

```bash
nano test_schema.py
```

E colocar:

```python
import json
import urllib.request
from jsonschema import validate
from jsonschema.exceptions import ValidationError


URL = "https://serverest.dev/usuarios/0uxuPY0cbmQhpEz1"


# Carrega o JSON Schema
with open("usuario-schema.json", "r") as file:
    schema = json.load(file)


# Faz a requisição
with urllib.request.urlopen(URL) as response:
    status_code = response.status
    body = response.read().decode("utf-8")


# Converte a resposta para JSON
data = json.loads(body)


# Teste 1: status code
assert status_code == 200, (
    f"Status esperado: 200, recebido: {status_code}"
)

print("✓ Status code: 200")


# Teste 2: JSON Schema
try:
    validate(instance=data, schema=schema)
    print("✓ JSON Schema válido")

except ValidationError as error:
    print("✗ JSON Schema inválido")
    print(error.message)
    exit(1)


# Teste 3: valores específicos
assert data["nome"] == "Fulano da Silva"
print("✓ Nome correto")

assert data["email"] == "fulano@qa.com"
print("✓ Email correto")

assert data["_id"] == "0uxuPY0cbmQhpEz1"
print("✓ ID correto")


print("\nTodos os testes passaram!")
```

---

# 5. Executar

Agora:

```bash
python3 test_schema.py
```

O resultado esperado será aproximadamente:

```text
✓ Status code: 200
✓ JSON Schema válido
✓ Nome correto
✓ Email correto
✓ ID correto

Todos os testes passaram!
```

Pronto: você acabou de criar um **teste automatizado de contrato de API no Ubuntu**. 🎯

---

# 6. Vamos entender a parte principal

A linha mais importante é:

```python
validate(instance=data, schema=schema)
```

Temos:

```text
             API
              │
              ▼
     JSON da resposta
              │
              ▼
        instance=data
              │
              │
              ▼
       JSON Schema
              │
              ▼
     validate(...)
              │
        ┌─────┴─────┐
        ▼           ▼
      Válido      Inválido
        │           │
        ▼           ▼
       ✓           ✗
```

Ou seja:

```python
validate(instance=data, schema=schema)
```

significa:

> Pegue o JSON que veio da API e valide contra o contrato definido no Schema.

---

# 7. Vamos provocar um erro

Essa é uma parte **muito importante para aprender testes**.

Abra o Schema:

```bash
nano usuario-schema.json
```

Mude:

```json
"nome": {
  "type": "string"
}
```

para:

```json
"nome": {
  "type": "number"
}
```

Agora execute novamente:

```bash
python3 test_schema.py
```

A API continua retornando:

```json
"nome": "Fulano da Silva"
```

Mas nosso Schema agora está dizendo:

```text
nome → precisa ser NUMBER
```

O teste deverá falhar:

```text
✓ Status code: 200
✗ JSON Schema inválido
'Fulano da Silva' is not of type 'number'
```

Isso demonstra na prática que o teste está funcionando.

---

# 8. Outro teste interessante: campo obrigatório

Volte o `nome` para:

```json
"nome": {
  "type": "string"
}
```

Agora remova `_id` da resposta? Não podemos alterar a API facilmente, então podemos simular isso no Python.

Depois desta linha:

```python
data = json.loads(body)
```

adicione:

```python
del data["_id"]
```

Fica:

```python
data = json.loads(body)

del data["_id"]
```

Execute:

```bash
python3 test_schema.py
```

O Schema vai detectar:

```text
✗ JSON Schema inválido
'_id' is a required property
```

Porque definimos:

```json
"required": [
  "nome",
  "email",
  "password",
  "administrador",
  "_id"
]
```

---

# 9. Estrutura final do projeto

No final teremos:

```text
teste-schema/
├── usuario-schema.json
└── test_schema.py
```

E podemos executar simplesmente:

```bash
cd teste-schema
python3 test_schema.py
```

Isso já é uma estrutura muito próxima do que você encontraria em um projeto real de **testes de API**.

### Próximo passo recomendado

Depois disso, eu faria uma evolução para **Pytest**, deixando o teste com uma estrutura profissional:

```text
tests/
├── schemas/
│   └── usuario_schema.json
│
└── test_usuarios.py
```

e executando tudo com:

```bash
pytest -v
```

Aí conseguimos ter **testes de status code + JSON Schema + dados + mensagens de erro**, tudo organizado e pronto para rodar em CI/CD.

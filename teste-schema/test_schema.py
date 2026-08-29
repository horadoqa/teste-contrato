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
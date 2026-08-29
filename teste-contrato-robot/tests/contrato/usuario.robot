*** Settings ***
Library    RequestsLibrary
Library    JSONSchemaLibrary

*** Variables ***
${BASE_URL}       https://serverest.dev
${USUARIO_ID}     0uxuPY0cbmQhpEz1

*** Test Cases ***
Deve validar o contrato da API de usuário
    ${response}=    GET    ${BASE_URL}/usuarios/${USUARIO_ID}
    Status Should Be    200    ${response}

    ${body}=    Set Variable    ${response.json()}

    # Linah de comando
    # # Validate Json    usuario.schema.json    ${body}

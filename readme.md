<h2>
Para executar o projeto:
</h2>

Acesse o link https://developers.google.com/drive/api/v3/quickstart/nodejs click em "Enable the Drive AP", selecione desktop app.
Crie um arquivo .env na raiz do projeto e preencha com as informações:
```
DRIVE CLIENT_ID=<seu client id>
DRIVE_CLIENT_SECRET=<seu client secret>
DRIVE_FOLDER_ID=<id da pasta no drive onde sera criado arquivos>
```

Execute o comando:

```
yarn
yarn start
```

Em seguida na primeira execução será necessario acessar a URL gerada no terminal, fazer o login, confirmar a autorização da conta e por fim digitar o codigo gerado apos o login no terminal. Nos acessos seguintes não será mais necessario fazer esse passo.

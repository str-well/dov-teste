# Backup do mu-plugin

`dov-headless.servidor-2026-09-27.php` é **exatamente o arquivo que rodava em
produção** até 27/09/2026, baixado do servidor antes de ser substituído pela
v2.3.0.

Ele nunca esteve no git nesta forma: é a v2.0.0 mais as duas edições que você
fez direto no servidor — `dov_classe_gramatical` no verbete e `page` na lista do
`dov_imagens`. A formatação dessas duas difere da do repositório (espaços no
lugar de tabulação, texto de ajuda mais curto), o que confirma que foram feitas
à mão, no editor do painel.

É o artefato de reversão: se a v2.3.0 der problema, subir este arquivo de volta
em `wp-content/mu-plugins/dov-headless.php` devolve o servidor ao estado
anterior. Perde os campos novos e as rotas de assinante, que é o esperado.

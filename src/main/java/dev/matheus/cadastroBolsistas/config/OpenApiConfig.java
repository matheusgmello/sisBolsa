package dev.matheus.cadastroBolsistas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/*
 * metadados do swagger. o esquema de seguranca e declarado como cookie porque
 * e assim que a api autentica - quem abre a interface ja logado no navegador
 * manda o cookie sozinho, sem precisar colar token em lugar nenhum.
 */
@Configuration
public class OpenApiConfig {

    private static final String COOKIE_JWT = "cookieJwt";

    @Bean
    public OpenAPI sisBolsaOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SisBolsa API")
                        .version("v1")
                        .description("""
                                API de gestao de bolsistas, laboratorios, projetos e frequencia.

                                Autenticacao: chame POST /api/auth/login com e-mail e senha. \
                                A resposta grava um cookie httpOnly com o token jwt, que o \
                                navegador passa a mandar sozinho nas chamadas seguintes.

                                Escopo por perfil: ADMIN alcanca tudo, PROFESSOR so os \
                                laboratorios que coordena, e BOLSISTA so as proprias \
                                frequencias e os colegas do proprio laboratorio."""))
                .components(new Components().addSecuritySchemes(COOKIE_JWT,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("token")
                                .description("Token jwt gravado por POST /api/auth/login.")))
                .addSecurityItem(new SecurityRequirement().addList(COOKIE_JWT));
    }
}

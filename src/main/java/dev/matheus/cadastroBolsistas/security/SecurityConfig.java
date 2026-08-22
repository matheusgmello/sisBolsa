package dev.matheus.cadastroBolsistas.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/*
 * substitui o AuthInterceptor artesanal. as rotas publicas continuam as mesmas
 * de antes: login, cadastro de admin e os estaticos.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    /*
     * o filtro entra como parametro do metodo, e nao do construtor: esta classe
     * tambem publica o passwordEncoder, entao receber o filtro no construtor
     * fecharia um ciclo (filtro -> LoginService -> passwordEncoder).
     */
    public SecurityFilterChain filterChain(HttpSecurity http, JwtCookieFilter jwtCookieFilter) throws Exception {
        http
            /*
             * csrf desligado porque nenhum formulario jsp manda token. o que
             * segura o csrf aqui e o SameSite=Strict do cookie do jwt.
             * quando o front virar estatico (etapa 6) isso volta a ser avaliado.
             */
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                /*
                 * o forward para a jsp e uma nova passada pelo filtro, e
                 * /WEB-INF/pages/*.jsp nao esta na lista de rotas publicas.
                 * sem liberar o dispatch de FORWARD, a tela de login redireciona
                 * para ela mesma e o browser entra em loop.
                 */
                .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
                .requestMatchers("/login", "/cadastro-admin/**", "/css/**", "/js/**", "/images/**").permitAll()
                .anyRequest().authenticated())
            /* login e logout sao os nossos controllers, nao os do spring */
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendRedirect(req.getContextPath() + "/login")))
            .addFilterBefore(jwtCookieFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

# Integração com Web Frameworks

Askama é agnóstico de framework. `Template::render()` retorna `Result<String, askama::Error>`,
e você decide como converter isso em uma resposta HTTP.

## Abordagem Recomendada: Erro Customizado

Crie um tipo de erro próprio que implemente o trait de resposta do seu framework:

```rust
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}
```

Dependências úteis:

```toml
[dependencies]
thiserror = "2"
displaydoc = "0.2"
```

## Axum

```rust
use axum::response::{Html, IntoResponse};
use axum::http::StatusCode;

async fn handler() -> Result<impl IntoResponse, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(Html(template.render()?))
}

// Erro customizado
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            AppError::Render(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Erro ao renderizar template"),
        };

        #[derive(Template)]
        #[template(path = "error.html")]
        struct ErrorTemplate {
            message: String,
        }

        if let Ok(body) = ErrorTemplate { message: message.to_string() }.render() {
            (status, Html(body)).into_response()
        } else {
            (status, "Algo deu errado").into_response()
        }
    }
}
```

## Actix-Web

```rust
use actix_web::web::Html;
use actix_web::{Responder, get};

#[get("/")]
async fn handler() -> Result<impl Responder, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(Html::new(template.render()?))
}

// Erro customizado
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}

impl actix_web::error::ResponseError for AppError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match &self {
            AppError::Render(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl Responder for AppError {
    type Body = String;

    fn respond_to(self, req: &actix_web::HttpRequest) -> actix_web::HttpResponse<Self::Body> {
        #[derive(Template)]
        #[template(path = "error.html")]
        struct Tmpl { /* campos */ }

        let status = self.status_code();
        if let Ok(body) = Tmpl { /* ... */ }.render() {
            (actix_web::web::Html::new(body), status).respond_to(req)
        } else {
            (String::new(), status).respond_to(req)
        }
    }
}
```

## Warp

```rust
use warp::reply::{Reply, html};

fn handler() -> Result<impl Reply, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(html(template.render()?))
}

// Erro customizado
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}

impl Reply for AppError {
    fn into_response(self) -> warp::reply::Response {
        let status = match &self {
            AppError::Render(_) => http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        #[derive(Template)]
        #[template(path = "error.html")]
        struct Tmpl { /* ... */ }

        if let Ok(body) = Tmpl { /* ... */ }.render() {
            warp::reply::with_status(warp::reply::html(body), status).into_response()
        } else {
            status.into_response()
        }
    }
}
```

## Rocket

```rust
use rocket::response::content::RawHtml;
use rocket::get;

#[get("/")]
fn handler() -> Result<impl rocket::response::Responder<'static>, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(RawHtml(template.render()?))
}

// Erro customizado
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}

impl<'r> rocket::response::Responder<'r, 'static> for AppError {
    fn respond_to(self, request: &'r rocket::Request<'_>) -> rocket::response::Result<'static> {
        let status = match &self {
            AppError::Render(_) => rocket::http::Status::InternalServerError,
        };

        #[derive(Template)]
        #[template(path = "error.html")]
        struct Tmpl { /* ... */ }

        if let Ok(body) = Tmpl { /* ... */ }.render() {
            (status, RawHtml(body)).respond_to(request)
        } else {
            (status, "Algo deu errado").respond_to(request)
        }
    }
}
```

## Poem

```rust
use poem::web::Html;
use poem::{IntoResponse, handler};

#[handler]
async fn handler() -> Result<impl IntoResponse, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(Html(template.render()?))
}

// Erro customizado
#[derive(Debug, displaydoc::Display, thiserror::Error)]
enum AppError {
    /// could not render template
    Render(#[from] askama::Error),
}

impl poem::error::ResponseError for AppError {
    fn status(&self) -> poem::http::StatusCode {
        match &self {
            AppError::Render(_) => poem::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> poem::Response {
        let status = self.status();

        #[derive(Template)]
        #[template(path = "error.html")]
        struct Tmpl { /* ... */ }

        if let Ok(body) = Tmpl { /* ... */ }.render() {
            (status, Html(body)).into_response()
        } else {
            (status, "Algo deu errado").into_response()
        }
    }
}
```

## Alternativa: askama_web

Se você não precisa de mensagens de erro customizadas, o crate
[`askama_web`](https://crates.io/crates/askama_web/) simplifica a integração:

```toml
[dependencies]
askama_web = "0.2"
```

```rust
use askama_web::WebTemplate;

#[derive(Template, WebTemplate)]
#[template(path = "hello.html")]
struct HelloTemplate<'a> {
    name: &'a str,
}

// Agora HelloTemplate implementa automaticamente
// - actix_web::Responder
// - axum::IntoResponse
// - warp::Reply
// - poem::IntoResponse
```

## Exemplo Completo: Axum + Askama

### Cargo.toml

```toml
[package]
name = "meu-app"
version = "0.1.0"
edition = "2024"

[dependencies]
askama = "0.16"
axum = "0.8"
tokio = { version = "1", features = ["full"] }
tower-http = { version = "0.6", features = ["fs"] }
thiserror = "2"
tracing = "0.1"
tracing-subscriber = "0.3"
```

### src/main.rs

```rust
use axum::{
    routing::get,
    response::{Html, IntoResponse},
    http::StatusCode,
    Router,
};
use askama::Template;
use std::net::SocketAddr;

#[derive(Template)]
#[template(path = "hello.html")]
struct HelloTemplate<'a> {
    name: &'a str,
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("render error: {0}")]
    Render(#[from] askama::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()).into_response()
    }
}

async fn hello() -> Result<impl IntoResponse, AppError> {
    let template = HelloTemplate { name: "world" };
    Ok(Html(template.render()?))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::init();

    let app = Router::new()
        .route("/", get(hello));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### templates/hello.html

```jinja
<!DOCTYPE html>
<html>
<head><title>Askama + Axum</title></head>
<body>
    <h1>Hello, {{ name }}!</h1>
</body>
</html>
```

### Executar

```bash
cargo run
# Acesse: http://localhost:3000
```

## Conversão Rápida de Erros

Para projetos pequenos, você pode converter o erro Askama rapidamente:

```rust
// Para Box<dyn Error + Send + Sync>
template.render().map_err(|e| e.into_box())?

// Para io::Error
template.render().map_err(|e| e.into_io_error())?
```

Mas a abordagem com erro customizado é **recomendada** para produção.

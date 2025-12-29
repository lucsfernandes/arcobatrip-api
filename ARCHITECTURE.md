# 🏗️ Arquitetura do Projeto Arcobatrip API

## 📖 Visão Geral

O **Arcobatrip API** é uma aplicação backend desenvolvida em **Node.js** com **TypeScript**, seguindo os princípios da **Clean Architecture** e **Domain-Driven Design (DDD)**. A aplicação é um sistema de planejamento de viagens em grupo que permite aos participantes gerenciar checklists e pontos turísticos.

---

## 🎯 Design Patterns Utilizados

### 1. **Clean Architecture**
A aplicação segue uma separação clara de responsabilidades em camadas:

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION                           │
│  (Controllers, Routers, Validators, Middlewares)           │
├─────────────────────────────────────────────────────────────┤
│                       APPLICATION                           │
│  (Use Cases, DTOs, Interfaces de Repositórios, Errors)     │
├─────────────────────────────────────────────────────────────┤
│                         DOMAIN                              │
│  (Entities, Interfaces de Domínio, Value Objects)          │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                           │
│  (Repositories, Database Config, Mappers, Migrations)      │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Repository Pattern**
Abstração da camada de persistência através de interfaces:
- `ITripRepo` - Interface para operações de Trip
- `IParticipantRepo` - Interface para operações de Participant
- `ITransactionRepo` - Interface para operações transacionais

### 3. **Factory Pattern**
Criação centralizada de dependências:
- `tripFactory.ts` - Factory para criar instâncias de Trip controllers/use cases
- `typeOrmRepoFactory.ts` - Factory para criar instâncias de repositórios

### 4. **Data Transfer Object (DTO)**
Objetos para transferência de dados entre camadas:
- `CreateTripRequestDTO` / `CreateTripResponseDTO`
- `CreateParticipantRequestDTO` / `CreateParticipantResponseDTO`

### 5. **Result Pattern**
Classe `Result<T>` para tratamento elegante de erros e sucessos sem exceções:
```typescript
Result.ok(value)   // Sucesso
Result.fail(error) // Falha
```

### 6. **Mapper Pattern**
Transformação de dados entre camadas:
- `TripMap` - Mapeia entidades Trip para domínio
- `ParticipantMap` - Mapeia entidades Participant para domínio

---

## 📁 Estrutura de Diretórios

```
src/
├── application/           # Camada de Aplicação
│   ├── errors/           # Erros customizados (UseCaseError, NotFoundError)
│   └── usecases/         # Casos de uso da aplicação
│       ├── IUseCase.ts   # Interface base para Use Cases
│       ├── Result.ts     # Classe Result para tratamento de resultados
│       ├── participants/ # Use cases de Participant
│       │   ├── IParticipantRepo.ts
│       │   ├── create/
│       │   └── findOneByEmail/
│       └── trips/        # Use cases de Trip
│           ├── ITripRepo.ts
│           └── create/
│
├── domain/               # Camada de Domínio
│   └── entities/         # Entidades do domínio
│       ├── base.entity.ts    # Entidade base com campos comuns
│       ├── Activity/
│       ├── Link/
│       ├── Participant/
│       ├── Trip/
│       └── User/
│
├── infra/                # Camada de Infraestrutura
│   ├── db/
│   │   ├── ormconfig.ts      # Configuração do TypeORM
│   │   ├── mappers/          # Mappers de entidades
│   │   └── migrations/       # Migrations do banco de dados
│   └── repositories/         # Implementações concretas dos repositórios
│       ├── ITransactionRepo.ts
│       ├── ParticipantRepo.ts
│       └── TripRepo.ts
│
├── main/                 # Ponto de entrada e configurações
│   ├── server.ts         # Inicialização do servidor
│   ├── logger.ts         # Configuração de logs
│   ├── config/
│   │   ├── app.ts        # Configuração do Express
│   │   ├── env.ts        # Variáveis de ambiente (Zod)
│   │   └── logger-transport.ts
│   └── factories/        # Factories para DI manual
│       ├── typeOrmRepoFactory.ts
│       ├── participant/
│       └── trip/
│
└── presentation/         # Camada de Apresentação
    ├── controllers/      # Controllers HTTP
    │   ├── BaseController.ts
    │   ├── Participant/
    │   └── Trip/
    ├── middlewares/      # Middlewares e rotas
    │   └── routes.ts
    ├── routers/          # Definição de rotas
    │   ├── v1TripRouter.ts
    │   └── trips/
    ├── utils/            # Utilitários
    │   ├── dayjs.ts
    │   └── validator.ts
    └── validators/       # Validadores Zod
        └── trip/
```

---

## 🔄 Fluxo de Requisição

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Router    │ ──▶ │  Validator  │ ──▶ │ Controller  │ ──▶ │   UseCase   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Response   │ ◀── │ Controller  │ ◀── │   Result    │ ◀── │ Repository  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Exemplo: Criar uma Viagem
1. **Router** (`createTripRouter.ts`) recebe a requisição POST `/api/v1/trips`
2. **Validator** (`tripPayloadValidation.ts`) valida o payload com Zod
3. **Controller** (`CreateTripController.ts`) extrai dados e chama o UseCase
4. **UseCase** (`CreateTripUseCase.ts`) executa a lógica de negócio
5. **Repository** (`TripRepo.ts`) persiste no banco de dados
6. **Result** retorna sucesso ou falha para o Controller
7. **Controller** formata e envia a resposta HTTP

---

## 🗃️ Modelo de Domínio

### Entidades Principais

#### Trip (Viagem)
```typescript
{
  id: string;
  destination: string;
  startsAt: string;
  endsAt: string;
  isConfirmed: boolean;
  participants: Participant[];
  activities?: Activity[];
  links?: Link[];
  users?: User[];
}
```

#### Participant (Participante)
```typescript
{
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  isConfirmed: boolean;
  tripId: string;
}
```

### Relacionamentos
```
Trip (1) ──── (N) Participant
Trip (1) ──── (N) Activity
Trip (1) ──── (N) Link
Trip (N) ──── (N) User
```

---

## 🛠️ Tecnologias e Bibliotecas

| Tecnologia | Propósito |
|------------|-----------|
| **Node.js** | Runtime JavaScript |
| **TypeScript** | Tipagem estática |
| **Express** | Framework HTTP |
| **TypeORM** | ORM para PostgreSQL |
| **PostgreSQL** | Banco de dados |
| **Zod** | Validação de schemas |
| **Winston** | Logging |
| **Day.js** | Manipulação de datas |
| **Swagger** | Documentação da API |
| **Docker** | Containerização |

---

## 🔐 Padrões de Código

### Interface de Use Case
```typescript
export interface IUseCase<REQ, RES> {
  execute(request?: REQ): Promise<Result<RES>>;
}
```

### Controller Base
```typescript
export abstract class BaseController {
  protected abstract executeImpl(req: Request, res: Response): Promise<Response>;
  public async execute(req: Request, res: Response): Promise<Response>;
  public ok<T>(res: Response, dto?: T): Response;
  public created<T>(res: Response, dto?: T): Response;
  public clientError(res: Response, error: UseCaseError | Error | string): Response;
  public fail(res: Response, error: UseCaseError | Error | string): Response;
}
```

### Entidade Base
```typescript
export class BaseEntity {
  id: string;           // UUID gerado automaticamente
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
  deletedAt?: Date;     // Soft delete
}
```

---

## 🌐 Endpoints da API

### Trips
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/trips` | Criar uma nova viagem |
| GET | `/api/v1/trips/:id` | Obter detalhes de uma viagem |
| PUT | `/api/v1/trips/:id` | Atualizar uma viagem |
| POST | `/api/v1/trips/:id/confirm` | Confirmar uma viagem |

### Health Check
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/health` | Verificar status da API |

---

## 🐳 Infraestrutura

### Docker
- `Dockerfile` - Build da imagem da aplicação
- `docker-compose.yml` - Ambiente de desenvolvimento
- `docker-compose.prod.yml` - Ambiente de produção

### Kubernetes (k8s/)
- `deployment.yaml` - Deploy da aplicação
- `service.yaml` - Serviço Kubernetes
- `ingress.yaml` - Configuração de Ingress
- `configmap.yaml` - Variáveis de configuração
- `hpa.yaml` - Horizontal Pod Autoscaler

---

## 📋 Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `PORT` | Porta do servidor | 3000 |
| `TYPEORM_HOST` | Host do PostgreSQL | localhost |
| `TYPEORM_PORT` | Porta do PostgreSQL | 5432 |
| `TYPEORM_USERNAME` | Usuário do banco | - |
| `TYPEORM_PASSWORD` | Senha do banco | - |
| `TYPEORM_DATABASE` | Nome do banco | - |
| `TYPEORM_SYNC` | Sincronizar schema | false |
| `TYPEORM_SSLMODE` | Modo SSL | prefer |

---

## 🎯 Princípios SOLID Aplicados

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Use Cases são extensíveis sem modificação
- **L**iskov Substitution: Interfaces permitem substituição de implementações
- **I**nterface Segregation: Interfaces específicas para cada contexto
- **D**ependency Inversion: Controllers dependem de abstrações (interfaces)

---

## 📝 Convenções de Código

### Nomenclatura
- **Entidades**: PascalCase (ex: `Trip`, `Participant`)
- **Interfaces**: Prefixo `I` (ex: `ITrip`, `IParticipant`)
- **DTOs**: Sufixo `DTO` (ex: `CreateTripRequestDTO`)
- **Use Cases**: Sufixo `UseCase` (ex: `CreateTripUseCase`)
- **Controllers**: Sufixo `Controller` (ex: `CreateTripController`)
- **Repositories**: Sufixo `Repo` (ex: `TripRepo`)

### Estrutura de Arquivos
- Uma entidade por arquivo
- Use Cases organizados por domínio (trips, participants)
- Mappers próximos à configuração do ORM

---

*Documentação gerada em: Dezembro 2025*

import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface UserEntity {
    readonly Id: number;
    Username: string;
    Password: string;
    Name?: string;
    Email: string;
    Phone: string;
    Country?: number;
}

export interface UserCreateEntity {
    readonly Username: string;
    readonly Password: string;
    readonly Name?: string;
    readonly Email: string;
    readonly Phone: string;
    readonly Country?: number;
}

export interface UserUpdateEntity extends UserCreateEntity {
    readonly Id: number;
}

export interface UserEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Username?: string | string[];
            Password?: string | string[];
            Name?: string | string[];
            Email?: string | string[];
            Phone?: string | string[];
            Country?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Username?: string | string[];
            Password?: string | string[];
            Name?: string | string[];
            Email?: string | string[];
            Phone?: string | string[];
            Country?: number | number[];
        };
        contains?: {
            Id?: number;
            Username?: string;
            Password?: string;
            Name?: string;
            Email?: string;
            Phone?: string;
            Country?: number;
        };
        greaterThan?: {
            Id?: number;
            Username?: string;
            Password?: string;
            Name?: string;
            Email?: string;
            Phone?: string;
            Country?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Username?: string;
            Password?: string;
            Name?: string;
            Email?: string;
            Phone?: string;
            Country?: number;
        };
        lessThan?: {
            Id?: number;
            Username?: string;
            Password?: string;
            Name?: string;
            Email?: string;
            Phone?: string;
            Country?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Username?: string;
            Password?: string;
            Name?: string;
            Email?: string;
            Phone?: string;
            Country?: number;
        };
    },
    $select?: (keyof UserEntity)[],
    $sort?: string | (keyof UserEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface UserEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<UserEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface UserUpdateEntityEvent extends UserEntityEvent {
    readonly previousEntity: UserEntity;
}

export class UserRepository {

    private static readonly DEFINITION = {
        table: "USER",
        properties: [
            {
                name: "Id",
                column: "USER_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Username",
                column: "USER_USERNAME",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Password",
                column: "USER_PASSWORD",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Name",
                column: "USER_NAME",
                type: "VARCHAR",
            },
            {
                name: "Email",
                column: "USER_EMAIL",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Phone",
                column: "USER_PHONE",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Country",
                column: "USER_COUNTRY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(UserRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: UserEntityOptions): UserEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): UserEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: UserCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "USER",
            entity: entity,
            key: {
                name: "Id",
                column: "USER_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: UserUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "USER",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "USER_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: UserCreateEntity | UserUpdateEntity): number {
        const id = (entity as UserUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as UserUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "USER",
            entity: entity,
            key: {
                name: "Id",
                column: "USER_ID",
                value: id
            }
        });
    }

    public count(options?: UserEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "USER"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: UserEntityEvent | UserUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-user-User", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-user-User").send(JSON.stringify(data));
    }
}

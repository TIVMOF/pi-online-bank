import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface UsersEntity {
    readonly Id: number;
    FName: string;
    LName: string;
    Email: string;
    Password: string;
    Phone: string;
    Username: string;
    Country?: number;
}

export interface UsersCreateEntity {
    readonly FName: string;
    readonly LName: string;
    readonly Email: string;
    readonly Password: string;
    readonly Phone: string;
    readonly Username: string;
    readonly Country?: number;
}

export interface UsersUpdateEntity extends UsersCreateEntity {
    readonly Id: number;
}

export interface UsersEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            FName?: string | string[];
            LName?: string | string[];
            Email?: string | string[];
            Password?: string | string[];
            Phone?: string | string[];
            Username?: string | string[];
            Country?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            FName?: string | string[];
            LName?: string | string[];
            Email?: string | string[];
            Password?: string | string[];
            Phone?: string | string[];
            Username?: string | string[];
            Country?: number | number[];
        };
        contains?: {
            Id?: number;
            FName?: string;
            LName?: string;
            Email?: string;
            Password?: string;
            Phone?: string;
            Username?: string;
            Country?: number;
        };
        greaterThan?: {
            Id?: number;
            FName?: string;
            LName?: string;
            Email?: string;
            Password?: string;
            Phone?: string;
            Username?: string;
            Country?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            FName?: string;
            LName?: string;
            Email?: string;
            Password?: string;
            Phone?: string;
            Username?: string;
            Country?: number;
        };
        lessThan?: {
            Id?: number;
            FName?: string;
            LName?: string;
            Email?: string;
            Password?: string;
            Phone?: string;
            Username?: string;
            Country?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            FName?: string;
            LName?: string;
            Email?: string;
            Password?: string;
            Phone?: string;
            Username?: string;
            Country?: number;
        };
    },
    $select?: (keyof UsersEntity)[],
    $sort?: string | (keyof UsersEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface UsersEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<UsersEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface UsersUpdateEntityEvent extends UsersEntityEvent {
    readonly previousEntity: UsersEntity;
}

export class UsersRepository {

    private static readonly DEFINITION = {
        table: "USERS",
        properties: [
            {
                name: "Id",
                column: "USERS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "FName",
                column: "USERS_FNAME",
                type: "VARCHAR",
                required: true
            },
            {
                name: "LName",
                column: "USERS_LNAME",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Email",
                column: "USERS_EMAIL",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Password",
                column: "USERS_PASSWORD",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Phone",
                column: "USERS_PHONE",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Username",
                column: "USERS_USERNAME",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Country",
                column: "USERS_COUNTRY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(UsersRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: UsersEntityOptions): UsersEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): UsersEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: UsersCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "USERS",
            entity: entity,
            key: {
                name: "Id",
                column: "USERS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: UsersUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "USERS",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "USERS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: UsersCreateEntity | UsersUpdateEntity): number {
        const id = (entity as UsersUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as UsersUpdateEntity);
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
            table: "USERS",
            entity: entity,
            key: {
                name: "Id",
                column: "USERS_ID",
                value: id
            }
        });
    }

    public count(options?: UsersEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "USERS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: UsersEntityEvent | UsersUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-users-Users", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-users-Users").send(JSON.stringify(data));
    }
}

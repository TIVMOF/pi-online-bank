import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BankAccountTypeEntity {
    readonly Id: number;
    Name: string;
}

export interface BankAccountTypeCreateEntity {
    readonly Name: string;
}

export interface BankAccountTypeUpdateEntity extends BankAccountTypeCreateEntity {
    readonly Id: number;
}

export interface BankAccountTypeEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof BankAccountTypeEntity)[],
    $sort?: string | (keyof BankAccountTypeEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankAccountTypeEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankAccountTypeEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankAccountTypeUpdateEntityEvent extends BankAccountTypeEntityEvent {
    readonly previousEntity: BankAccountTypeEntity;
}

export class BankAccountTypeRepository {

    private static readonly DEFINITION = {
        table: "BANKACCOUNTTYPE",
        properties: [
            {
                name: "Id",
                column: "BANKACCOUNTTYPE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BANKACCOUNTTYPE_NAME",
                type: "VARCHAR",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankAccountTypeRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankAccountTypeEntityOptions): BankAccountTypeEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BankAccountTypeEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BankAccountTypeCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKACCOUNTTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTTYPE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankAccountTypeUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKACCOUNTTYPE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKACCOUNTTYPE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankAccountTypeCreateEntity | BankAccountTypeUpdateEntity): number {
        const id = (entity as BankAccountTypeUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankAccountTypeUpdateEntity);
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
            table: "BANKACCOUNTTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTTYPE_ID",
                value: id
            }
        });
    }

    public count(options?: BankAccountTypeEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKACCOUNTTYPE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankAccountTypeEntityEvent | BankAccountTypeUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-entities-BankAccountType", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-entities-BankAccountType").send(JSON.stringify(data));
    }
}

import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BankAccountStatusEntity {
    readonly Id: number;
    Name: string;
}

export interface BankAccountStatusCreateEntity {
    readonly Name: string;
}

export interface BankAccountStatusUpdateEntity extends BankAccountStatusCreateEntity {
    readonly Id: number;
}

export interface BankAccountStatusEntityOptions {
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
    $select?: (keyof BankAccountStatusEntity)[],
    $sort?: string | (keyof BankAccountStatusEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankAccountStatusEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankAccountStatusEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankAccountStatusUpdateEntityEvent extends BankAccountStatusEntityEvent {
    readonly previousEntity: BankAccountStatusEntity;
}

export class BankAccountStatusRepository {

    private static readonly DEFINITION = {
        table: "BANKACCOUNTSTATUS",
        properties: [
            {
                name: "Id",
                column: "BANKACCOUNTSTATUS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BANKACCOUNTSTATUS_NAME",
                type: "VARCHAR",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankAccountStatusRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankAccountStatusEntityOptions): BankAccountStatusEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BankAccountStatusEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BankAccountStatusCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKACCOUNTSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTSTATUS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankAccountStatusUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKACCOUNTSTATUS",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKACCOUNTSTATUS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankAccountStatusCreateEntity | BankAccountStatusUpdateEntity): number {
        const id = (entity as BankAccountStatusUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankAccountStatusUpdateEntity);
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
            table: "BANKACCOUNTSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTSTATUS_ID",
                value: id
            }
        });
    }

    public count(options?: BankAccountStatusEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKACCOUNTSTATUS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankAccountStatusEntityEvent | BankAccountStatusUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-entities-BankAccountStatus", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-entities-BankAccountStatus").send(JSON.stringify(data));
    }
}

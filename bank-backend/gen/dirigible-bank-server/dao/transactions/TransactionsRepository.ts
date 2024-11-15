import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface TransactionsEntity {
    readonly Id: number;
    Reciever?: number;
    Sender?: number;
    Amount?: number;
    Date?: Date;
}

export interface TransactionsCreateEntity {
    readonly Reciever?: number;
    readonly Sender?: number;
    readonly Amount?: number;
    readonly Date?: Date;
}

export interface TransactionsUpdateEntity extends TransactionsCreateEntity {
    readonly Id: number;
}

export interface TransactionsEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Reciever?: number | number[];
            Sender?: number | number[];
            Amount?: number | number[];
            Date?: Date | Date[];
        };
        notEquals?: {
            Id?: number | number[];
            Reciever?: number | number[];
            Sender?: number | number[];
            Amount?: number | number[];
            Date?: Date | Date[];
        };
        contains?: {
            Id?: number;
            Reciever?: number;
            Sender?: number;
            Amount?: number;
            Date?: Date;
        };
        greaterThan?: {
            Id?: number;
            Reciever?: number;
            Sender?: number;
            Amount?: number;
            Date?: Date;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Reciever?: number;
            Sender?: number;
            Amount?: number;
            Date?: Date;
        };
        lessThan?: {
            Id?: number;
            Reciever?: number;
            Sender?: number;
            Amount?: number;
            Date?: Date;
        };
        lessThanOrEqual?: {
            Id?: number;
            Reciever?: number;
            Sender?: number;
            Amount?: number;
            Date?: Date;
        };
    },
    $select?: (keyof TransactionsEntity)[],
    $sort?: string | (keyof TransactionsEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface TransactionsEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<TransactionsEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface TransactionsUpdateEntityEvent extends TransactionsEntityEvent {
    readonly previousEntity: TransactionsEntity;
}

export class TransactionsRepository {

    private static readonly DEFINITION = {
        table: "TRANSACTIONS",
        properties: [
            {
                name: "Id",
                column: "TRANSACTIONS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Reciever",
                column: "TRANSACTIONS_RECIEVER",
                type: "INTEGER",
            },
            {
                name: "Sender",
                column: "TRANSACTIONS_SENDER",
                type: "INTEGER",
            },
            {
                name: "Amount",
                column: "TRANSACTIONS_AMOUNT",
                type: "DOUBLE",
            },
            {
                name: "Date",
                column: "TRANSACTIONS_DATE",
                type: "DATE",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(TransactionsRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: TransactionsEntityOptions): TransactionsEntity[] {
        return this.dao.list(options).map((e: TransactionsEntity) => {
            EntityUtils.setDate(e, "Date");
            return e;
        });
    }

    public findById(id: number): TransactionsEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "Date");
        return entity ?? undefined;
    }

    public create(entity: TransactionsCreateEntity): number {
        EntityUtils.setLocalDate(entity, "Date");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "TRANSACTIONS",
            entity: entity,
            key: {
                name: "Id",
                column: "TRANSACTIONS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: TransactionsUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "Date");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "TRANSACTIONS",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "TRANSACTIONS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: TransactionsCreateEntity | TransactionsUpdateEntity): number {
        const id = (entity as TransactionsUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as TransactionsUpdateEntity);
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
            table: "TRANSACTIONS",
            entity: entity,
            key: {
                name: "Id",
                column: "TRANSACTIONS_ID",
                value: id
            }
        });
    }

    public count(options?: TransactionsEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "TRANSACTIONS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: TransactionsEntityEvent | TransactionsUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-transactions-Transactions", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-transactions-Transactions").send(JSON.stringify(data));
    }
}

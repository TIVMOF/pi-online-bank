import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface TransactionEntity {
    readonly Id: number;
    Reciever?: number;
    Sender?: number;
    Amount?: number;
    Date?: Date;
}

export interface TransactionCreateEntity {
    readonly Reciever?: number;
    readonly Sender?: number;
    readonly Amount?: number;
    readonly Date?: Date;
}

export interface TransactionUpdateEntity extends TransactionCreateEntity {
    readonly Id: number;
}

export interface TransactionEntityOptions {
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
    $select?: (keyof TransactionEntity)[],
    $sort?: string | (keyof TransactionEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface TransactionEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<TransactionEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface TransactionUpdateEntityEvent extends TransactionEntityEvent {
    readonly previousEntity: TransactionEntity;
}

export class TransactionRepository {

    private static readonly DEFINITION = {
        table: "TRANSACTION",
        properties: [
            {
                name: "Id",
                column: "TRANSACTION_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Reciever",
                column: "TRANSACTION_RECIEVER",
                type: "INTEGER",
            },
            {
                name: "Sender",
                column: "TRANSACTION_SENDER",
                type: "INTEGER",
            },
            {
                name: "Amount",
                column: "TRANSACTION_AMOUNT",
                type: "DOUBLE",
            },
            {
                name: "Date",
                column: "TRANSACTION_DATE",
                type: "DATE",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(TransactionRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: TransactionEntityOptions): TransactionEntity[] {
        return this.dao.list(options).map((e: TransactionEntity) => {
            EntityUtils.setDate(e, "Date");
            return e;
        });
    }

    public findById(id: number): TransactionEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "Date");
        return entity ?? undefined;
    }

    public create(entity: TransactionCreateEntity): number {
        EntityUtils.setLocalDate(entity, "Date");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "TRANSACTION",
            entity: entity,
            key: {
                name: "Id",
                column: "TRANSACTION_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: TransactionUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "Date");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "TRANSACTION",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "TRANSACTION_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: TransactionCreateEntity | TransactionUpdateEntity): number {
        const id = (entity as TransactionUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as TransactionUpdateEntity);
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
            table: "TRANSACTION",
            entity: entity,
            key: {
                name: "Id",
                column: "TRANSACTION_ID",
                value: id
            }
        });
    }

    public count(options?: TransactionEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "TRANSACTION"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: TransactionEntityEvent | TransactionUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-transaction-Transaction", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-transaction-Transaction").send(JSON.stringify(data));
    }
}

import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface BankAccountEntity {
    readonly Id: number;
    IBAN: string;
    User?: number;
    Amount: number;
    Currency?: number;
    Type?: number;
    Status?: number;
    CreationDate: Date;
}

export interface BankAccountCreateEntity {
    readonly IBAN: string;
    readonly User?: number;
    readonly Amount: number;
    readonly Currency?: number;
    readonly Type?: number;
    readonly Status?: number;
}

export interface BankAccountUpdateEntity extends BankAccountCreateEntity {
    readonly Id: number;
}

export interface BankAccountEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            IBAN?: string | string[];
            User?: number | number[];
            Amount?: number | number[];
            Currency?: number | number[];
            Type?: number | number[];
            Status?: number | number[];
            CreationDate?: Date | Date[];
        };
        notEquals?: {
            Id?: number | number[];
            IBAN?: string | string[];
            User?: number | number[];
            Amount?: number | number[];
            Currency?: number | number[];
            Type?: number | number[];
            Status?: number | number[];
            CreationDate?: Date | Date[];
        };
        contains?: {
            Id?: number;
            IBAN?: string;
            User?: number;
            Amount?: number;
            Currency?: number;
            Type?: number;
            Status?: number;
            CreationDate?: Date;
        };
        greaterThan?: {
            Id?: number;
            IBAN?: string;
            User?: number;
            Amount?: number;
            Currency?: number;
            Type?: number;
            Status?: number;
            CreationDate?: Date;
        };
        greaterThanOrEqual?: {
            Id?: number;
            IBAN?: string;
            User?: number;
            Amount?: number;
            Currency?: number;
            Type?: number;
            Status?: number;
            CreationDate?: Date;
        };
        lessThan?: {
            Id?: number;
            IBAN?: string;
            User?: number;
            Amount?: number;
            Currency?: number;
            Type?: number;
            Status?: number;
            CreationDate?: Date;
        };
        lessThanOrEqual?: {
            Id?: number;
            IBAN?: string;
            User?: number;
            Amount?: number;
            Currency?: number;
            Type?: number;
            Status?: number;
            CreationDate?: Date;
        };
    },
    $select?: (keyof BankAccountEntity)[],
    $sort?: string | (keyof BankAccountEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankAccountEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankAccountEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankAccountUpdateEntityEvent extends BankAccountEntityEvent {
    readonly previousEntity: BankAccountEntity;
}

export class BankAccountRepository {

    private static readonly DEFINITION = {
        table: "BANKACCOUNT",
        properties: [
            {
                name: "Id",
                column: "BANKACCOUNT_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "IBAN",
                column: "BANKACCOUNT_PROPERTY3",
                type: "VARCHAR",
                required: true
            },
            {
                name: "User",
                column: "BANKACCOUNT_USER",
                type: "INTEGER",
            },
            {
                name: "Amount",
                column: "BANKACCOUNT_AMOUNT",
                type: "DOUBLE",
                required: true
            },
            {
                name: "Currency",
                column: "BANKACCOUNT_CURRENCY",
                type: "INTEGER",
            },
            {
                name: "Type",
                column: "BANKACCOUNT_TYPE",
                type: "INTEGER",
            },
            {
                name: "Status",
                column: "BANKACCOUNT_STATUS",
                type: "INTEGER",
            },
            {
                name: "CreationDate",
                column: "BANKACCOUNT_CREATIONDATE",
                type: "DATE",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankAccountRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankAccountEntityOptions): BankAccountEntity[] {
        return this.dao.list(options).map((e: BankAccountEntity) => {
            EntityUtils.setDate(e, "CreationDate");
            return e;
        });
    }

    public findById(id: number): BankAccountEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "CreationDate");
        return entity ?? undefined;
    }

    public create(entity: BankAccountCreateEntity): number {
        EntityUtils.setLocalDate(entity, "CreationDate");
        // @ts-ignore
        (entity as BankAccountEntity).CreationDate = new Date();;
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKACCOUNT",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNT_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankAccountUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "CreationDate");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKACCOUNT",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKACCOUNT_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankAccountCreateEntity | BankAccountUpdateEntity): number {
        const id = (entity as BankAccountUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankAccountUpdateEntity);
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
            table: "BANKACCOUNT",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNT_ID",
                value: id
            }
        });
    }

    public count(options?: BankAccountEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKACCOUNT"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankAccountEntityEvent | BankAccountUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-bankAccount-BankAccount", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-bankAccount-BankAccount").send(JSON.stringify(data));
    }
}

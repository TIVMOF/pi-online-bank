import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface BankAccountsEntity {
    readonly Id: number;
    Amount: number;
    IBAN: string;
    Users?: number;
    BankAccountType?: number;
    BankAccountStatus?: number;
    CreationDate: Date;
    Currency?: number;
}

export interface BankAccountsCreateEntity {
    readonly Amount: number;
    readonly IBAN: string;
    readonly Users?: number;
    readonly BankAccountType?: number;
    readonly BankAccountStatus?: number;
    readonly CreationDate: Date;
    readonly Currency?: number;
}

export interface BankAccountsUpdateEntity extends BankAccountsCreateEntity {
    readonly Id: number;
}

export interface BankAccountsEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Amount?: number | number[];
            IBAN?: string | string[];
            Users?: number | number[];
            BankAccountType?: number | number[];
            BankAccountStatus?: number | number[];
            CreationDate?: Date | Date[];
            Currency?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Amount?: number | number[];
            IBAN?: string | string[];
            Users?: number | number[];
            BankAccountType?: number | number[];
            BankAccountStatus?: number | number[];
            CreationDate?: Date | Date[];
            Currency?: number | number[];
        };
        contains?: {
            Id?: number;
            Amount?: number;
            IBAN?: string;
            Users?: number;
            BankAccountType?: number;
            BankAccountStatus?: number;
            CreationDate?: Date;
            Currency?: number;
        };
        greaterThan?: {
            Id?: number;
            Amount?: number;
            IBAN?: string;
            Users?: number;
            BankAccountType?: number;
            BankAccountStatus?: number;
            CreationDate?: Date;
            Currency?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Amount?: number;
            IBAN?: string;
            Users?: number;
            BankAccountType?: number;
            BankAccountStatus?: number;
            CreationDate?: Date;
            Currency?: number;
        };
        lessThan?: {
            Id?: number;
            Amount?: number;
            IBAN?: string;
            Users?: number;
            BankAccountType?: number;
            BankAccountStatus?: number;
            CreationDate?: Date;
            Currency?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Amount?: number;
            IBAN?: string;
            Users?: number;
            BankAccountType?: number;
            BankAccountStatus?: number;
            CreationDate?: Date;
            Currency?: number;
        };
    },
    $select?: (keyof BankAccountsEntity)[],
    $sort?: string | (keyof BankAccountsEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankAccountsEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankAccountsEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankAccountsUpdateEntityEvent extends BankAccountsEntityEvent {
    readonly previousEntity: BankAccountsEntity;
}

export class BankAccountsRepository {

    private static readonly DEFINITION = {
        table: "BANKACCOUNTS",
        properties: [
            {
                name: "Id",
                column: "BANKACCOUNTS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Amount",
                column: "BANKACCOUNTS_AMOUNT",
                type: "DOUBLE",
                required: true
            },
            {
                name: "IBAN",
                column: "BANKACCOUNTS_PROPERTY3",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Users",
                column: "BANKACCOUNTS_USERS",
                type: "INTEGER",
            },
            {
                name: "BankAccountType",
                column: "BANKACCOUNTS_BANKACCOUNTTYPE",
                type: "INTEGER",
            },
            {
                name: "BankAccountStatus",
                column: "BANKACCOUNTS_BANKACCOUNTSTATUS",
                type: "INTEGER",
            },
            {
                name: "CreationDate",
                column: "BANKACCOUNTS_CREATIONDATE",
                type: "DATE",
                required: true
            },
            {
                name: "Currency",
                column: "BANKACCOUNTS_CURRENCY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankAccountsRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankAccountsEntityOptions): BankAccountsEntity[] {
        return this.dao.list(options).map((e: BankAccountsEntity) => {
            EntityUtils.setDate(e, "CreationDate");
            return e;
        });
    }

    public findById(id: number): BankAccountsEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "CreationDate");
        return entity ?? undefined;
    }

    public create(entity: BankAccountsCreateEntity): number {
        EntityUtils.setLocalDate(entity, "CreationDate");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKACCOUNTS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankAccountsUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "CreationDate");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKACCOUNTS",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKACCOUNTS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankAccountsCreateEntity | BankAccountsUpdateEntity): number {
        const id = (entity as BankAccountsUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankAccountsUpdateEntity);
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
            table: "BANKACCOUNTS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKACCOUNTS_ID",
                value: id
            }
        });
    }

    public count(options?: BankAccountsEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKACCOUNTS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankAccountsEntityEvent | BankAccountsUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-bankAccount-BankAccounts", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-bankAccount-BankAccounts").send(JSON.stringify(data));
    }
}

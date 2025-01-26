import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface BankFacilityStatusEntity {
    readonly Id: number;
    Name?: string;
}

export interface BankFacilityStatusCreateEntity {
    readonly Name?: string;
}

export interface BankFacilityStatusUpdateEntity extends BankFacilityStatusCreateEntity {
    readonly Id: number;
}

export interface BankFacilityStatusEntityOptions {
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
    $select?: (keyof BankFacilityStatusEntity)[],
    $sort?: string | (keyof BankFacilityStatusEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface BankFacilityStatusEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<BankFacilityStatusEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface BankFacilityStatusUpdateEntityEvent extends BankFacilityStatusEntityEvent {
    readonly previousEntity: BankFacilityStatusEntity;
}

export class BankFacilityStatusRepository {

    private static readonly DEFINITION = {
        table: "BANKFACILITYSTATUS",
        properties: [
            {
                name: "Id",
                column: "BANKFACILITYSTATUS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "BANKFACILITYSTATUS_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(BankFacilityStatusRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: BankFacilityStatusEntityOptions): BankFacilityStatusEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): BankFacilityStatusEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: BankFacilityStatusCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "BANKFACILITYSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITYSTATUS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: BankFacilityStatusUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "BANKFACILITYSTATUS",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "BANKFACILITYSTATUS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: BankFacilityStatusCreateEntity | BankFacilityStatusUpdateEntity): number {
        const id = (entity as BankFacilityStatusUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as BankFacilityStatusUpdateEntity);
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
            table: "BANKFACILITYSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "BANKFACILITYSTATUS_ID",
                value: id
            }
        });
    }

    public count(options?: BankFacilityStatusEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "BANKFACILITYSTATUS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: BankFacilityStatusEntityEvent | BankFacilityStatusUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-Settings-BankFacilityStatus", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-Settings-BankFacilityStatus").send(JSON.stringify(data));
    }
}

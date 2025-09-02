import { SupabaseClient } from "@supabase/supabase-js";
import {
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet,
} from "../types/framework.types";
import {
  RadioOptionSetRow,
  MultiSelectOptionSetRow,
  SelectOptionSetRow,
} from "../types/database-rows.types";
import {
  RadioOptionSetMapper,
  MultiSelectOptionSetMapper,
  SelectOptionSetMapper,
} from "../mappers/option-set.mappers";
import { BaseRepository } from "./base.repository";
import {
  updateMetadata,
  createMetadata,
  mergeMetadata,
} from "../utils/metadata.utils";

export class RadioOptionSetRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<RadioOptionSet[]> {
    const rows = await this.handleQueryArray<RadioOptionSetRow>(
      this.supabase
        .from("radio_option_sets")
        .select("*")
        .order("metadata->createdAt", { ascending: false }),
      "findAll radio option sets"
    );

    return rows.map(RadioOptionSetMapper.toDomain);
  }

  async findById(id: string): Promise<RadioOptionSet | null> {
    this.validateId(id, "findById radio option set");

    try {
      const { data, error } = await this.supabase
        .from("radio_option_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data ? RadioOptionSetMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, "findById radio option set");
    }
  }

  async create(
    optionSet: RadioOptionSet | Omit<RadioOptionSet, "id">
  ): Promise<RadioOptionSet> {
    const optionSetWithMetadata = {
      ...optionSet,
      metadata: await mergeMetadata(optionSet.metadata),
    };

    const dbData = RadioOptionSetMapper.toDatabase(
      optionSetWithMetadata as RadioOptionSet
    );

    const row = await this.handleQuery<RadioOptionSetRow>(
      this.supabase.from("radio_option_sets").insert(dbData).select().single(),
      "create radio option set"
    );

    return RadioOptionSetMapper.toDomain(row);
  }

  async update(id: string, data: Partial<RadioOptionSet>): Promise<void> {
    this.validateId(id, "update radio option set");

    const updateData = RadioOptionSetMapper.toPartialDatabase(data);

    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase.from("radio_option_sets").update(updateData).eq("id", id),
      "update radio option set"
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, "delete radio option set");

    await this.handleMutation(
      this.supabase.from("radio_option_sets").delete().eq("id", id),
      "delete radio option set"
    );
  }

  async findActive(): Promise<RadioOptionSet[]> {
    const rows = await this.handleQueryArray<RadioOptionSetRow>(
      this.supabase
        .from("radio_option_sets")
        .select("*")
        .eq("is_active", true)
        .order("metadata->createdAt", { ascending: false }),
      "findActive radio option sets"
    );

    return rows.map(RadioOptionSetMapper.toDomain);
  }
}

export class MultiSelectOptionSetRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<MultiSelectOptionSet[]> {
    const rows = await this.handleQueryArray<MultiSelectOptionSetRow>(
      this.supabase
        .from("checkbox_option_sets")
        .select("*")
        .order("metadata->createdAt", { ascending: false }),
      "findAll multi-select option sets"
    );

    return rows.map(MultiSelectOptionSetMapper.toDomain);
  }

  async findById(id: string): Promise<MultiSelectOptionSet | null> {
    this.validateId(id, "findById multi-select option set");

    try {
      const { data, error } = await this.supabase
        .from("checkbox_option_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data ? MultiSelectOptionSetMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, "findById multi-select option set");
    }
  }

  async create(
    optionSet: MultiSelectOptionSet | Omit<MultiSelectOptionSet, "id">
  ): Promise<MultiSelectOptionSet> {
    const optionSetWithMetadata = {
      ...optionSet,
      metadata: await mergeMetadata(optionSet.metadata),
    };

    const dbData = MultiSelectOptionSetMapper.toDatabase(
      optionSetWithMetadata as MultiSelectOptionSet
    );

    const row = await this.handleQuery<MultiSelectOptionSetRow>(
      this.supabase
        .from("checkbox_option_sets")
        .insert(dbData)
        .select()
        .single(),
      "create multi-select option set"
    );

    return MultiSelectOptionSetMapper.toDomain(row);
  }

  async update(id: string, data: Partial<MultiSelectOptionSet>): Promise<void> {
    this.validateId(id, "update multi-select option set");

    const updateData = MultiSelectOptionSetMapper.toPartialDatabase(data);

    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase
        .from("checkbox_option_sets")
        .update(updateData)
        .eq("id", id),
      "update multi-select option set"
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, "delete multi-select option set");

    await this.handleMutation(
      this.supabase.from("checkbox_option_sets").delete().eq("id", id),
      "delete multi-select option set"
    );
  }

  async findActive(): Promise<MultiSelectOptionSet[]> {
    const rows = await this.handleQueryArray<MultiSelectOptionSetRow>(
      this.supabase
        .from("checkbox_option_sets")
        .select("*")
        .eq("is_active", true)
        .order("metadata->createdAt", { ascending: false }),
      "findActive multi-select option sets"
    );

    return rows.map(MultiSelectOptionSetMapper.toDomain);
  }
}

export class SelectOptionSetRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findAll(): Promise<SelectOptionSet[]> {
    const rows = await this.handleQueryArray<SelectOptionSetRow>(
      this.supabase
        .from("dropdown_option_sets")
        .select("*")
        .order("metadata->createdAt", { ascending: false }),
      "findAll select option sets"
    );

    return rows.map(SelectOptionSetMapper.toDomain);
  }

  async findById(id: string): Promise<SelectOptionSet | null> {
    this.validateId(id, "findById select option set");

    try {
      const { data, error } = await this.supabase
        .from("dropdown_option_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data ? SelectOptionSetMapper.toDomain(data) : null;
    } catch (error) {
      this.handleError(error, "findById select option set");
    }
  }

  async create(
    optionSet: SelectOptionSet | Omit<SelectOptionSet, "id">
  ): Promise<SelectOptionSet> {
    const optionSetWithMetadata = {
      ...optionSet,
      metadata: await mergeMetadata(optionSet.metadata),
    };

    const dbData = SelectOptionSetMapper.toDatabase(
      optionSetWithMetadata as SelectOptionSet
    );

    const row = await this.handleQuery<SelectOptionSetRow>(
      this.supabase
        .from("dropdown_option_sets")
        .insert(dbData)
        .select()
        .single(),
      "create select option set"
    );

    return SelectOptionSetMapper.toDomain(row);
  }

  async update(id: string, data: Partial<SelectOptionSet>): Promise<void> {
    this.validateId(id, "update select option set");

    const updateData = SelectOptionSetMapper.toPartialDatabase(data);

    // Update metadata timestamp
    if (data.metadata) {
      updateData.metadata = updateMetadata(data.metadata as any);
    } else {
      updateData.metadata = updateMetadata(await createMetadata());
    }

    await this.handleMutation(
      this.supabase
        .from("dropdown_option_sets")
        .update(updateData)
        .eq("id", id),
      "update select option set"
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, "delete select option set");

    await this.handleMutation(
      this.supabase.from("dropdown_option_sets").delete().eq("id", id),
      "delete select option set"
    );
  }

  async findActive(): Promise<SelectOptionSet[]> {
    const rows = await this.handleQueryArray<SelectOptionSetRow>(
      this.supabase
        .from("dropdown_option_sets")
        .select("*")
        .eq("is_active", true)
        .order("metadata->createdAt", { ascending: false }),
      "findActive select option sets"
    );

    return rows.map(SelectOptionSetMapper.toDomain);
  }
}

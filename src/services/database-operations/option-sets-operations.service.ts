import { SupabaseClient } from "@supabase/supabase-js";
import {
  MultiSelectOptionSet,
  RadioOptionSet,
  RatingScale,
  SelectOptionSet,
} from "../../types/framework.types";
import {
  getRepositoryService,
  isRepositoryServiceInitialized,
} from "../repository.service";
import { SupabaseClientService } from "../supabase-client.service";

/**
 * Service for option sets database operations
 */
export class OptionSetsOperationsService {
  constructor(
    private client: SupabaseClient,
    private clientService: SupabaseClientService
  ) {}

  private getRepositories() {
    if (!isRepositoryServiceInitialized()) {
      throw new Error(
        "Repository service not initialized. Please call initialize() first."
      );
    }
    return getRepositoryService();
  }

  // Rating Scales
  async getRatingScales() {
    const repositories = this.getRepositories();
    return repositories.ratingScales.findAll();
  }

  async getRatingScale(id: string) {
    const repositories = this.getRepositories();
    return repositories.ratingScales.findById(id);
  }

  async addRatingScale(scale: RatingScale | Omit<RatingScale, "id">) {
    const repositories = this.getRepositories();
    return repositories.ratingScales.create(scale);
  }

  async updateRatingScale(id: string, data: Partial<RatingScale>) {
    const repositories = this.getRepositories();
    return repositories.ratingScales.update(id, data);
  }

  async deleteRatingScale(id: string) {
    const repositories = this.getRepositories();
    return repositories.ratingScales.delete(id);
  }

  // Radio Option Sets
  async getRadioOptionSets() {
    const repositories = this.getRepositories();
    return repositories.radioOptionSets.findAll();
  }

  async getRadioOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.radioOptionSets.findById(id);
  }

  async addRadioOptionSet(optionSet: RadioOptionSet | Omit<RadioOptionSet, "id">) {
    const repositories = this.getRepositories();
    return repositories.radioOptionSets.create(optionSet);
  }

  async updateRadioOptionSet(id: string, data: Partial<RadioOptionSet>) {
    const repositories = this.getRepositories();
    return repositories.radioOptionSets.update(id, data);
  }

  async deleteRadioOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.radioOptionSets.delete(id);
  }

  // Multi-Select Option Sets
  async getMultiSelectOptionSets() {
    const repositories = this.getRepositories();
    return repositories.multiSelectOptionSets.findAll();
  }

  async getMultiSelectOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.multiSelectOptionSets.findById(id);
  }

  async addMultiSelectOptionSet(
    optionSet: MultiSelectOptionSet | Omit<MultiSelectOptionSet, "id">
  ) {
    const repositories = this.getRepositories();
    return repositories.multiSelectOptionSets.create(optionSet);
  }

  async updateMultiSelectOptionSet(
    id: string,
    data: Partial<MultiSelectOptionSet>
  ) {
    const repositories = this.getRepositories();
    return repositories.multiSelectOptionSets.update(id, data);
  }

  async deleteMultiSelectOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.multiSelectOptionSets.delete(id);
  }

  // Select Option Sets
  async getSelectOptionSets() {
    const repositories = this.getRepositories();
    return repositories.selectOptionSets.findAll();
  }

  async getSelectOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.selectOptionSets.findById(id);
  }

  async addSelectOptionSet(
    optionSet: SelectOptionSet | Omit<SelectOptionSet, "id">
  ) {
    const repositories = this.getRepositories();
    return repositories.selectOptionSets.create(optionSet);
  }

  async updateSelectOptionSet(id: string, data: Partial<SelectOptionSet>) {
    const repositories = this.getRepositories();
    return repositories.selectOptionSets.update(id, data);
  }

  async deleteSelectOptionSet(id: string) {
    const repositories = this.getRepositories();
    return repositories.selectOptionSets.delete(id);
  }
}